import { OrganizationMembershipRole, type UserAccount } from '@prisma/client';
import { describe, expect, onTestFinished, test } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  retrieveOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from '~/features/user-accounts/settings/account/account-settings-constants';
import { AVATAR_PATH_PREFIX } from '~/features/user-accounts/user-account-constants';
import { BUCKET_NAME } from '~/features/user-accounts/user-account-constants';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { stripeHandlers } from '~/test/mocks/handlers/stripe';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { setupUserWithOrgAndAddAsMember } from '~/test/server-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import {
  badRequest,
  type DataWithResponseInit,
} from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';
import { getToast } from '~/utils/toast.server';

import { action } from './account';

const createUrl = () => 'http://localhost:3000/settings/account';

async function sendAuthenticatedRequest({
  formData,
  user,
}: {
  formData: FormData;
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    url: createUrl(),
    user,
    method: 'POST',
    formData,
  });

  return await action({ request, params: {}, context: {} });
}

async function setup() {
  const user = createPopulatedUserAccount();
  await saveUserAccountToDatabase(user);

  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(user.id);
  });

  return user;
}

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe('/settings/account route action', () => {
  test('given: an unauthenticated request, should: throw a redirect to the login page', async () => {
    expect.assertions(2);

    const request = new Request(createUrl(), {
      method: 'POST',
      body: toFormData({}),
    });

    try {
      await action({ request, params: {}, context: {} });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          '/login?redirectTo=%2Fsettings%2Faccount',
        );
      } else {
        // Fail test if error is not a Response
        expect(error).toBeInstanceOf(Response);
      }
    }
  });

  describe(`${UPDATE_USER_ACCOUNT_INTENT} intent`, () => {
    const intent = UPDATE_USER_ACCOUNT_INTENT;

    test('given: a valid name, should: update user account name and return a success toast', async () => {
      const user = await setup();

      const newName = createPopulatedUserAccount().name;
      const formData = toFormData({ intent, name: newName });

      const actual = (await sendAuthenticatedRequest({
        user,
        formData,
      })) as DataWithResponseInit<{ success: string }>;

      // Verify user account was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);

      const maybeToast = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Your account has been updated',
        type: 'success',
      });
    });

    test('given: a valid name and avatar URL, should: update user account name and avatar and return a success toast', async () => {
      const user = await setup();

      const newName = createPopulatedUserAccount().name;
      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const formData = toFormData({ intent, name: newName, avatar: file });

      const actual = (await sendAuthenticatedRequest({
        user,
        formData,
      })) as DataWithResponseInit<{ success: string }>;

      // Verify user account was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const expectedKey = `${AVATAR_PATH_PREFIX}/${user.id}.png`;
      const expectedUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${expectedKey}`;
      expect(updatedUser?.imageUrl).toEqual(expectedUrl);

      const maybeToast = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), { headers: { cookie: maybeToast ?? '' } }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Your account has been updated',
        type: 'success',
      });
    });

    test('given: only an avatar URL update, should: update just the avatar and return a success toast', async () => {
      const user = await setup();

      const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
      const formData = toFormData({ intent, name: user.name, avatar: file });

      const actual = (await sendAuthenticatedRequest({
        user,
        formData,
      })) as DataWithResponseInit<{ success: string }>;

      // Verify only avatar was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(user.name);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const expectedKey = `${AVATAR_PATH_PREFIX}/${user.id}.png`;
      const expectedUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${expectedKey}`;
      expect(updatedUser?.imageUrl).toEqual(expectedUrl);

      const maybeToast = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Your account has been updated',
        type: 'success',
      });
    });

    test.each([
      {
        given: 'no name provided',
        body: { intent },
        expected: badRequest({ errors: { name: { message: 'Required' } } }),
      },
      {
        given: 'a name that is too short (1 character)',
        body: { intent, name: 'a' },
        expected: badRequest({
          errors: {
            name: {
              message: 'settings:user-account.form.name-min-length',
            },
          },
        }),
      },
      {
        given: 'a name that is too long (129 characters)',
        body: { intent, name: 'a'.repeat(129) },
        expected: badRequest({
          errors: {
            name: {
              message: 'settings:user-account.form.name-max-length',
            },
          },
        }),
      },
      {
        given: 'a name with only whitespace',
        body: { intent, name: '   ' },
        expected: badRequest({
          errors: {
            name: {
              message: 'settings:user-account.form.name-min-length',
            },
          },
        }),
      },
      {
        given: 'a too short name with whitespace',
        body: { intent, name: '  a ' },
        expected: badRequest({
          errors: {
            name: {
              message: 'settings:user-account.form.name-min-length',
            },
          },
        }),
      },
      {
        given: 'an invalid avatar (string instead of file)',
        body: { intent, name: 'Test User', avatar: 'not-a-file' },
        expected: badRequest({
          errors: {
            avatar: {
              message: 'settings:user-account.form.avatar-must-be-file',
            },
          },
        }),
      },
    ])(
      'given: $given, should: return a 400 status code with an error message',
      async ({ body, expected }) => {
        const user = await setup();

        const formData = toFormData(body);

        const actual = await sendAuthenticatedRequest({
          user,
          formData,
        });
        expect(actual).toEqual(expected);
      },
    );
  });

  describe(`${DELETE_USER_ACCOUNT_INTENT} intent`, () => {
    const intent = DELETE_USER_ACCOUNT_INTENT;

    test('given: a user who is only a member or admin of organizations, should: delete the user account and return a redirect to the home page', async () => {
      // Add MSW event listener for Stripe subscription update
      let stripeUpdateCalled = false;
      const updateListener = ({ request }: { request: Request }) => {
        if (new URL(request.url).pathname.startsWith('/v1/subscriptions/')) {
          stripeUpdateCalled = true;
        }
      };
      server.events.on('response:mocked', updateListener);
      onTestFinished(() => {
        server.events.removeListener('response:mocked', updateListener);
      });

      // Setup: Create a user who is a member of one org and admin of another
      const { user: memberUser, organization: memberOrg } =
        await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.member,
        });
      const { organization: adminOrg } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      await addMembersToOrganizationInDatabaseById({
        id: adminOrg.id,
        members: [memberUser.id],
        role: OrganizationMembershipRole.admin,
      });

      const formData = toFormData({ intent });

      const response = (await sendAuthenticatedRequest({
        user: memberUser,
        formData,
      })) as Response;

      // Verify redirect to home page
      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual('/');

      // Verify user was deleted
      const deletedUser = await retrieveUserAccountFromDatabaseById(
        memberUser.id,
      );
      expect(deletedUser).toEqual(null);

      // Verify organizations still exist
      const memberOrgExists = await retrieveOrganizationFromDatabaseById(
        memberOrg.id,
      );
      const adminOrgExists = await retrieveOrganizationFromDatabaseById(
        adminOrg.id,
      );
      expect(memberOrgExists).not.toEqual(null);
      expect(adminOrgExists).not.toEqual(null);

      // Verify Stripe was called to adjust seats
      expect(stripeUpdateCalled).toEqual(true);
    });

    test('given: a user who is the sole owner (only member) of an organization, should: delete both the user account and organization, and return a redirect to the home page', async () => {
      // Add MSW event listener for Stripe subscription update - it should be
      // called since it's a sole owner, and the org's subscriptions should
      // be cancelled.
      let stripeUpdateCalled = false;
      const updateListener = ({ request }: { request: Request }) => {
        if (new URL(request.url).pathname.startsWith('/v1/subscriptions/')) {
          stripeUpdateCalled = true;
        }
      };
      server.events.on('response:mocked', updateListener);
      onTestFinished(() => {
        server.events.removeListener('response:mocked', updateListener);
      });

      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });

      const formData = toFormData({ intent });

      const response = (await sendAuthenticatedRequest({
        user,
        formData,
      })) as Response;

      // Verify redirect to home page
      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual('/');

      // Verify user was deleted
      const deletedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(deletedUser).toEqual(null);

      // Verify organization was deleted
      const deletedOrg = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(deletedOrg).toEqual(null);

      // It displays a toast
      const maybeToast = response.headers.get('Set-Cookie');
      const toastCookie = maybeToast?.match(/__toast=[^;]+/)?.[0] ?? '';
      const { toast } = await getToast(
        new Request(createUrl(), { headers: { cookie: toastCookie } }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Your account has been deleted',
        type: 'success',
      });

      // Verify Stripe was called (since org was deleted, also via Stripe)
      expect(stripeUpdateCalled).toEqual(true);
    });

    test('given: a user who is an owner of an organization with other members, should: return a 400 error indicating they must transfer ownership first', async () => {
      const { user: ownerUser, organization } =
        await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.owner,
        });
      const otherUser = createPopulatedUserAccount();
      await saveUserAccountToDatabase(otherUser);
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [otherUser.id],
        role: OrganizationMembershipRole.member,
      });

      const formData = toFormData({ intent });

      const response = (await sendAuthenticatedRequest({
        user: ownerUser,
        formData,
      })) as Response;

      expect(response).toEqual(
        badRequest({
          error:
            'Cannot delete account while owner of organizations with other members',
        }),
      );

      // Cleanup the additional user since setupUserWithOrgAndAddAsMember won't handle it
      await deleteUserAccountFromDatabaseById(otherUser.id);
    });

    test('given: a user who is both a sole owner of one org and a member of others, should: delete the user account, delete the solely owned org, and return a redirect to home page', async () => {
      // Add MSW event listener for Stripe subscription update
      let stripeUpdateCalled = false;
      const updateListener = ({ request }: { request: Request }) => {
        if (new URL(request.url).pathname.startsWith('/v1/subscriptions/')) {
          stripeUpdateCalled = true;
        }
      };
      server.events.on('response:mocked', updateListener);
      onTestFinished(() => {
        server.events.removeListener('response:mocked', updateListener);
      });

      // Setup user as member of one org
      const { user: memberUser, organization: memberOrg } =
        await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.member,
        });
      // Setup same user as sole owner of another org
      const soloOwnedOrg = createPopulatedOrganization();
      await saveOrganizationToDatabase(soloOwnedOrg);
      await addMembersToOrganizationInDatabaseById({
        id: soloOwnedOrg.id,
        members: [memberUser.id],
        role: OrganizationMembershipRole.owner,
      });

      const formData = toFormData({ intent });

      const response = (await sendAuthenticatedRequest({
        user: memberUser,
        formData,
      })) as Response;

      // Verify redirect to home page
      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual('/');

      // Verify user was deleted
      const deletedUser = await retrieveUserAccountFromDatabaseById(
        memberUser.id,
      );
      expect(deletedUser).toEqual(null);

      // Verify solely owned org was deleted
      const deletedSoloOrg = await retrieveOrganizationFromDatabaseById(
        soloOwnedOrg.id,
      );
      expect(deletedSoloOrg).toEqual(null);

      // Verify member org still exists
      const memberOrgExists = await retrieveOrganizationFromDatabaseById(
        memberOrg.id,
      );
      expect(memberOrgExists).not.toEqual(null);

      // Verify Stripe was called to adjust seats for the remaining org
      expect(stripeUpdateCalled).toEqual(true);
    });
  });
});
