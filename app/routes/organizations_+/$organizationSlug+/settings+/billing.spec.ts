import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, onTestFinished, test } from 'vitest';

import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  OPEN_CHECKOUT_SESSION_INTENT,
  priceLookupKeysByTierAndInterval,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from '~/features/billing/billing-constants';
import {
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
  createPopulatedStripeSubscriptionWithItemsAndPrice,
  getRandomLookupKey,
} from '~/features/billing/billing-factories.server';
import { retrieveStripePriceFromDatabaseByLookupKey } from '~/features/billing/stripe-prices-model.server';
import { retrieveStripeSubscriptionFromDatabaseById } from '~/features/billing/stripe-subscription-model.server';
import {
  retrieveStripeSubscriptionScheduleFromDatabaseById,
  saveSubscriptionScheduleWithPhasesAndPriceToDatabase,
} from '~/features/billing/stripe-subscription-schedule-model.server';
import {
  createPopulatedNotification,
  createPopulatedNotificationRecipient,
} from '~/features/notifications/notifications-factories.server';
import { saveNotificationWithRecipientForUserAndOrganizationInDatabaseById } from '~/features/notifications/notifications-model.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { addMembersToOrganizationInDatabaseById } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { stripeHandlers } from '~/test/mocks/handlers/stripe';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import {
  setupUserWithOrgAndAddAsMember,
  setupUserWithTrialOrgAndAddAsMember,
} from '~/test/server-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import type { DataWithResponseInit } from '~/utils/http-responses.server';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';

import { action } from './billing';

const createUrl = (organizationSlug: string) =>
  `http://localhost:3000/organizations/${organizationSlug}/settings/billing`;

async function sendAuthenticatedRequest({
  formData,
  organizationSlug,
  user,
}: {
  formData: FormData;
  organizationSlug: Organization['slug'];
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    url: createUrl(organizationSlug),
    user,
    method: 'POST',
    formData,
  });

  return await action({ request, context: {}, params: { organizationSlug } });
}

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

/**
 * Seed `count` notifications (each with one recipient) into the test database
 * for the given user and organization.
 */
export async function setupNotificationsForUserAndOrganization({
  user,
  organization,
  count = 1,
}: {
  user: UserAccount;
  organization: Organization;
  count?: number;
}) {
  const notifications = Array.from({ length: count }).map(() =>
    createPopulatedNotification({ organizationId: organization.id }),
  );
  const notificationsWithRecipients = await Promise.all(
    notifications.map(notification => {
      const { notificationId: _, ...recipient } =
        createPopulatedNotificationRecipient({
          notificationId: notification.id,
          userId: user.id,
          readAt: null,
        });

      return saveNotificationWithRecipientForUserAndOrganizationInDatabaseById({
        notification,
        recipient,
      });
    }),
  );

  return {
    notifications,
    recipients: notificationsWithRecipients.map(
      ({ recipients }) => recipients[0],
    ),
  };
}

describe('/organizations/:organizationSlug/settings/billing route action', () => {
  test('given: an unauthenticated request, should: throw a redirect to the login page', async () => {
    expect.assertions(2);

    const organization = createPopulatedOrganization();
    const request = new Request(createUrl(organization.slug), {
      method: 'POST',
      body: toFormData({}),
    });

    try {
      await action({
        request,
        context: {},
        params: { organizationSlug: organization.slug },
      });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/login?redirectTo=%2Forganizations%2F${organization.slug}%2Fsettings%2Fbilling`,
        );
      }
    }
  });

  test('given: a user who is not a member of the organization, should: return a 404', async () => {
    // Create a user with an organization.
    const { user } = await setupUserWithOrgAndAddAsMember();
    // Creates a user and another organization.
    const { organization } = await setupUserWithOrgAndAddAsMember();

    const actual = await sendAuthenticatedRequest({
      user,
      formData: toFormData({}),
      organizationSlug: organization.slug,
    });
    const expected = notFound();

    expect(actual).toEqual(expected);
  });

  describe(`${CANCEL_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = CANCEL_SUBSCRIPTION_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, should: return a 302 and redirect to the customer portal',
      async role => {
        // listen for the Stripe "cancel subscription" POST
        let stripeCancelCalled = false;
        const cancelListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/billing_portal/sessions') {
            stripeCancelCalled = true;
          }
        };
        server.events.on('response:mocked', cancelListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', cancelListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent }),
        })) as Response;

        expect(actual.status).toEqual(302);
        expect(actual.headers.get('Location')).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(stripeCancelCalled).toEqual(true);
      },
    );
  });

  describe(`${KEEP_CURRENT_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = KEEP_CURRENT_SUBSCRIPTION_INTENT;

    test('given: a member role, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      })) as DataWithResponseInit<object>;

      expect(actual.init?.status).toEqual(forbidden().init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a %s role without pending schedule, should: return a 200 and NOT call the release endpoint',
      async role => {
        let releaseCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            /^\/v1\/subscription_schedules\/.+\/release$/.test(
              new URL(request.url).pathname,
            )
          ) {
            releaseCalled = true;
          }
        };
        server.events.on('response:mocked', listener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', listener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent }),
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(releaseCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a %s role with pending schedule, should: return a 200, call the release endpoint and delete the schedule from the database',
      async role => {
        let releaseCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            /^\/v1\/subscription_schedules\/.+\/release$/.test(
              new URL(request.url).pathname,
            )
          ) {
            releaseCalled = true;
          }
        };
        server.events.on('response:mocked', listener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', listener);
        });

        const { user, organization, subscription } =
          await setupUserWithOrgAndAddAsMember({
            role,
            lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
          });
        const price = await retrieveStripePriceFromDatabaseByLookupKey(
          priceLookupKeysByTierAndInterval.low.monthly,
        );
        const subscriptionSchedule =
          createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
            subscriptionId: subscription.stripeId,
            phases: [{ price: price! }],
          });
        await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(
          subscriptionSchedule,
        );

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent }),
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(releaseCalled).toEqual(true);
        const schedule =
          await retrieveStripeSubscriptionScheduleFromDatabaseById(
            subscriptionSchedule.stripeId,
          );
        expect(schedule).toEqual(null);
      },
    );
  });

  describe(`${OPEN_CHECKOUT_SESSION_INTENT} intent`, () => {
    const intent = OPEN_CHECKOUT_SESSION_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, should: return a 302 and redirect to the customer portal',
      async role => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/checkout/sessions') {
            checkoutSessionCalled = true;
          }
        };
        server.events.on('response:mocked', checkoutListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', checkoutListener);
        });

        const { user, organization } =
          await setupUserWithTrialOrgAndAddAsMember({ role });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get('Location')).toMatch(
          /^https:\/\/checkout\.stripe\.com\/pay\/cs_[\dA-Za-z]+(?:\?.*)?$/,
        );
        expect(checkoutSessionCalled).toEqual(true);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, but their organization has too many members for the chosen plan, should: return a 409',
      async role => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/checkout/sessions') {
            checkoutSessionCalled = true;
          }
        };
        server.events.on('response:mocked', checkoutListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', checkoutListener);
        });

        const { user, organization } =
          await setupUserWithTrialOrgAndAddAsMember({ role });
        const otherUser = createPopulatedUserAccount();
        await saveUserAccountToDatabase(otherUser);
        await addMembersToOrganizationInDatabaseById({
          id: organization.id,
          members: [otherUser.id],
        });
        onTestFinished(async () => {
          await deleteUserAccountFromDatabaseById(otherUser.id);
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
        })) as DataWithResponseInit<{ message: string }>;
        const expected = conflict();

        expect(actual).toEqual(expected);
        expect(checkoutSessionCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, but their organization already has a subscription, should: return a 409',
      async role => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/checkout/sessions') {
            checkoutSessionCalled = true;
          }
        };
        server.events.on('response:mocked', checkoutListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', checkoutListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
        })) as DataWithResponseInit<{ message: string }>;
        const expected = conflict();

        expect(actual).toEqual(expected);
        expect(checkoutSessionCalled).toEqual(false);
      },
    );
  });

  describe(`${RESUME_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = RESUME_SUBSCRIPTION_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s and a subscription that is set to cancel at period end, should: return a 200 and call the update endpoint and update the subscription in the database',
      async role => {
        let resumeCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            new URL(request.url).pathname ===
            `/v1/subscriptions/${subscription.stripeId}`
          ) {
            resumeCalled = true;
          }
        };
        server.events.on('response:mocked', listener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', listener);
        });

        const { user, organization, subscription } =
          await setupUserWithOrgAndAddAsMember({
            role,
            subscription: createPopulatedStripeSubscriptionWithItemsAndPrice({
              cancelAtPeriodEnd: true,
            }),
          });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent }),
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(resumeCalled).toEqual(true);

        const updatedSubscription =
          await retrieveStripeSubscriptionFromDatabaseById(
            subscription.stripeId,
          );
        expect(updatedSubscription?.cancelAtPeriodEnd).toEqual(false);
      },
    );
  });

  describe(`${SWITCH_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = SWITCH_SUBSCRIPTION_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      {
        data: {},
        expected: badRequest({
          errors: { lookupKey: { message: 'Required' } },
        }),
      },
    ])(
      'given: invalid data $data, should: return validation errors',
      async ({ data, expected }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent, ...data }),
        })) as DataWithResponseInit<object>;

        expect(actual).toEqual(expected);
      },
    );

    test('given: an invalid lookup key, should: return a bad request', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.admin,
      });

      const response = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({
          intent,
          lookupKey: 'invalid_lookup_key',
        }),
      })) as DataWithResponseInit<object>;

      expect(response.init?.status).toEqual(400);
      expect(response.data).toEqual({ message: 'Price not found' });
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, should: return a 302 and redirect to the customer portal',
      async role => {
        let switchSessionCalled = false;
        const switchListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/billing_portal/sessions') {
            switchSessionCalled = true;
          }
        };
        server.events.on('response:mocked', switchListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', switchListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
          lookupKey: getRandomLookupKey(),
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get('Location')).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(switchSessionCalled).toEqual(true);
      },
    );
  });

  describe(`${UPDATE_BILLING_EMAIL_INTENT} intent`, () => {
    const intent = UPDATE_BILLING_EMAIL_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, billingEmail: 'new@example.com' }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      {
        data: {},
        expected: badRequest({
          errors: { billingEmail: { message: 'Required' } },
        }),
      },
      {
        data: { billingEmail: 'not-an-email' },
        expected: badRequest({
          errors: {
            billingEmail: {
              message:
                'billing:billing-page.update-billing-email-modal.email-invalid',
            },
          },
        }),
      },
    ])(
      'given: invalid data $data, should: return validation errors',
      async ({ data, expected }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent, ...data }),
        })) as DataWithResponseInit<object>;

        expect(actual).toEqual(expected);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s with a new email, should: update the billing email and return a 200',
      async role => {
        let updateCustomerCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith('/v1/customers')) {
            updateCustomerCalled = true;
          }
        };
        server.events.on('response:mocked', updateListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', updateListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
          organization: createPopulatedOrganization({
            billingEmail: 'old@example.com',
          }),
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({
            intent,
            billingEmail: 'new@example.com',
          }),
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(updateCustomerCalled).toEqual(true);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s with the same email, should: skip the update and return a 200',
      async role => {
        let updateCustomerCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith('/v1/customers')) {
            updateCustomerCalled = true;
          }
        };
        server.events.on('response:mocked', updateListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', updateListener);
        });

        const currentEmail = 'same@example.com';
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
          organization: createPopulatedOrganization({
            billingEmail: currentEmail,
          }),
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({
            intent,
            billingEmail: currentEmail,
          }),
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(updateCustomerCalled).toEqual(false);
      },
    );
  });

  describe(`${VIEW_INVOICES_INTENT} intent`, () => {
    const intent = VIEW_INVOICES_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, should: return a 302 and redirect to the customer portal',
      async role => {
        let portalSessionCalled = false;
        const portalListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === '/v1/billing_portal/sessions') {
            portalSessionCalled = true;
          }
        };
        server.events.on('response:mocked', portalListener);
        onTestFinished(() => {
          server.events.removeListener('response:mocked', portalListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent }),
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get('Location')).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(portalSessionCalled).toEqual(true);
      },
    );
  });
});
