import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { data, href } from 'react-router';
import { describe, expect, onTestFinished, test } from 'vitest';

import {
  OPEN_CHECKOUT_SESSION_INTENT,
  priceLookupKeysByTierAndInterval,
} from '~/features/billing/billing-constants';
import { getRandomLookupKey } from '~/features/billing/billing-factories.server';
import {
  MARK_ALL_NOTIFICATIONS_AS_READ_INTENT,
  MARK_ONE_NOTIFICATION_AS_READ_INTENT,
  NOTIFICATION_PANEL_OPENED_INTENT,
} from '~/features/notifications/notification-constants';
import {
  createPopulatedNotification,
  createPopulatedNotificationRecipient,
} from '~/features/notifications/notifications-factories.server';
import {
  retrieveNotificationPanelForUserAndOrganizationFromDatabaseById,
  retrieveNotificationRecipientsForUserAndOrganizationFromDatabase,
  saveNotificationWithRecipientForUserAndOrganizationInDatabaseById,
} from '~/features/notifications/notifications-model.server';
import { SWITCH_ORGANIZATION_INTENT } from '~/features/organizations/layout/sidebar-layout-constants';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
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

import { action } from './_sidebar-layout';

const createUrl = (organizationSlug: string) =>
  `http://localhost:3000/organizations/${organizationSlug}`;

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

describe('/organizations/:organizationSlug route action', () => {
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
          `/login?redirectTo=%2Forganizations%2F${organization.slug}`,
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

  describe(`${SWITCH_ORGANIZATION_INTENT} intent`, () => {
    const intent = SWITCH_ORGANIZATION_INTENT;

    const createBody = ({
      currentPath = href('/organizations/:organizationSlug/settings/general', {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      organizationId = createPopulatedOrganization().id,
    }: Partial<{
      currentPath: string;
      organizationId: string;
    }>) => toFormData({ intent, currentPath, organizationId });

    test("given: a valid organization switch request, should: redirect to the new organization's same route with updated cookie", async () => {
      const { user, organization: currentOrg } =
        await setupUserWithOrgAndAddAsMember();
      const targetOrg = createPopulatedOrganization();
      await saveOrganizationToDatabase(targetOrg);
      await addMembersToOrganizationInDatabaseById({
        id: targetOrg.id,
        members: [user.id],
        role: 'member',
      });

      const formData = createBody({
        currentPath: href('/organizations/:organizationSlug/settings/general', {
          organizationSlug: currentOrg.slug,
        }),
        organizationId: targetOrg.id,
      });

      const response = (await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: currentOrg.slug,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual(
        `/organizations/${targetOrg.slug}/settings/general`,
      );

      // Verify cookie is set correctly
      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).toContain(`__organization_switcher=ey`);
    });

    test('given: an invalid organization ID of a non-existent organization, should: return a 404 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const formData = createBody({
        organizationId: 'invalid-id',
        currentPath: href('/organizations/:organizationSlug/settings/general', {
          organizationSlug: organization.slug,
        }),
      });

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: organization.slug,
      });
      const expected = notFound();

      expect(actual).toEqual(expected);
    });

    test('given: a request to switch to an organization the user is not a member of, should: return a 404', async () => {
      const { user, organization: currentOrg } =
        await setupUserWithOrgAndAddAsMember();
      const { organization: targetOrg } =
        await setupUserWithOrgAndAddAsMember();

      const formData = createBody({
        organizationId: targetOrg.id,
        currentPath: href('/organizations/:organizationSlug/settings/general', {
          organizationSlug: currentOrg.slug,
        }),
      });

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: currentOrg.slug,
      });
      const expected = notFound();

      expect(actual).toEqual(expected);
    });

    test('given: a request without an intent, should: return a 400 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const formData = createBody({
        organizationId: organization.id,
        currentPath: href('/organizations/:organizationSlug/settings/general', {
          organizationSlug: organization.slug,
        }),
      });
      formData.delete('intent');

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: organization.slug,
      });
      const expected = badRequest({
        errors: {
          intent: {
            message:
              "Invalid discriminator value. Expected 'markAllAsRead' | 'markOneAsRead' | 'notificationPanelOpened' | 'switchOrganization' | 'openCheckoutSession'",
          },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('given: a request with an invalid intent, should: return a 400 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const formData = createBody({
        organizationId: organization.id,
        currentPath: href('/organizations/:organizationSlug/settings/general', {
          organizationSlug: organization.slug,
        }),
      });
      formData.delete('intent');
      formData.append('intent', 'invalidIntent');

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: organization.slug,
      });
      const expected = badRequest({
        errors: {
          intent: {
            message:
              "Invalid discriminator value. Expected 'markAllAsRead' | 'markOneAsRead' | 'notificationPanelOpened' | 'switchOrganization' | 'openCheckoutSession'",
          },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('given: no organization ID, should: return a 400 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const formData = createBody({});
      formData.delete('organizationId');

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: organization.slug,
      });
      const expected = badRequest({
        errors: { organizationId: { message: 'Required' } },
      });

      expect(actual).toEqual(expected);
    });

    test('given: no current path, should: return a 400 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const formData = createBody({ organizationId: organization.id });
      formData.delete('currentPath');

      const actual = await sendAuthenticatedRequest({
        user,
        formData,
        organizationSlug: organization.slug,
      });
      const expected = badRequest({
        errors: { currentPath: { message: 'Required' } },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe(`${MARK_ALL_NOTIFICATIONS_AS_READ_INTENT} intent`, () => {
    const intent = MARK_ALL_NOTIFICATIONS_AS_READ_INTENT;

    test('given: a valid request, should: mark all notifications as read', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();
      await setupNotificationsForUserAndOrganization({
        user,
        organization,
        count: 3,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        formData: toFormData({ intent }),
        organizationSlug: organization.slug,
      })) as DataWithResponseInit<object>;
      const expected = data({});

      expect(actual.init?.status).toEqual(expected.init?.status);

      const updatedRecipients =
        await retrieveNotificationRecipientsForUserAndOrganizationFromDatabase({
          userId: user.id,
          organizationId: organization.id,
        });

      expect(updatedRecipients.length).toEqual(3);
      expect(
        updatedRecipients.every(recipient => recipient.readAt !== null),
      ).toEqual(true);
    });
  });

  describe(`${MARK_ONE_NOTIFICATION_AS_READ_INTENT} intent`, () => {
    const intent = MARK_ONE_NOTIFICATION_AS_READ_INTENT;

    test('given: a valid request, should: mark the specified notification as read', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();
      const { recipients } = await setupNotificationsForUserAndOrganization({
        user,
        organization,
        count: 2,
      });
      const [recipient] = recipients;

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, recipientId: recipient.id }),
      })) as DataWithResponseInit<object>;
      const expected = data({});

      expect(actual.init?.status).toEqual(expected.init?.status);

      const updatedRecipients =
        await retrieveNotificationRecipientsForUserAndOrganizationFromDatabase({
          userId: user.id,
          organizationId: organization.id,
        });

      expect(updatedRecipients.length).toEqual(2);
      expect(
        updatedRecipients.find(r => r.id === recipient.id)?.readAt,
      ).not.toBeNull();
    });

    test('given: no recipientId, should: return a 400 with validation errors', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();
      await setupNotificationsForUserAndOrganization({
        user,
        organization,
        count: 1,
      });

      const actual = await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      });
      const expected = badRequest({
        errors: { recipientId: { message: 'Required' } },
      });

      expect(actual).toEqual(expected);
    });

    test('given: a recipient belonging to another user, should: return a 404', async () => {
      const { user: userA, organization } =
        await setupUserWithOrgAndAddAsMember();
      // seed one for A
      await setupNotificationsForUserAndOrganization({
        user: userA,
        organization,
        count: 1,
      });

      // create B in same org
      const { user: userB } = await setupUserWithOrgAndAddAsMember();
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [userB.id],
      });
      // seed one for B
      const { recipients: recipientsB } =
        await setupNotificationsForUserAndOrganization({
          user: userB,
          organization,
          count: 1,
        });
      const [recipientB] = recipientsB;

      const actual = (await sendAuthenticatedRequest({
        user: userA,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, recipientId: recipientB.id }),
      })) as DataWithResponseInit<{ message: string }>;
      const expected = notFound();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });
  });

  describe(`${NOTIFICATION_PANEL_OPENED_INTENT} intent`, () => {
    const intent = NOTIFICATION_PANEL_OPENED_INTENT;

    test('given: a valid request, should: return a 200 and mark the notification panel as opened', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember();

      const panelBefore =
        await retrieveNotificationPanelForUserAndOrganizationFromDatabaseById({
          userId: user.id,
          organizationId: organization.id,
        });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent }),
      })) as DataWithResponseInit<object>;
      const expected = data({});

      expect(actual.init?.status).toEqual(expected.init?.status);

      const panelAfter =
        await retrieveNotificationPanelForUserAndOrganizationFromDatabaseById({
          userId: user.id,
          organizationId: organization.id,
        });
      expect(panelAfter?.lastOpenedAt).not.toEqual(panelBefore?.lastOpenedAt);
    });
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
      'given: a valid request from a %s, but their organization already has a subscription, should: return a 409',
      async role => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
        })) as DataWithResponseInit<object>;
        const expected = conflict();

        expect(actual).toEqual(expected);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, but their organization has too many members for the chosen plan, should: return a 409',
      async role => {
        const { user, organization } =
          await setupUserWithTrialOrgAndAddAsMember({
            role,
          });
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
        })) as DataWithResponseInit<object>;
        const expected = conflict();

        expect(actual).toEqual(expected);
      },
    );

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
  });
});
