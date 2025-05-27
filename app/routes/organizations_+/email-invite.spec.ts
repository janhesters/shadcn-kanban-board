import type { UserAccount } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { ACCEPT_EMAIL_INVITE_INTENT } from '~/features/organizations/accept-email-invite/accept-email-invite-constants';
import { getEmailInviteInfoFromSession } from '~/features/organizations/accept-email-invite/accept-email-invite-session.server';
import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from '~/features/organizations/organization-membership-model.server';
import {
  retrieveEmailInviteLinkFromDatabaseById,
  saveOrganizationEmailInviteLinkToDatabase,
} from '~/features/organizations/organizations-email-invite-link-model.server';
import { createPopulatedOrganizationEmailInviteLink } from '~/features/organizations/organizations-factories.server';
import { stripeHandlers } from '~/test/mocks/handlers/stripe';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { setupUserWithOrgAndAddAsMember } from '~/test/server-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import { badRequest } from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';
import { getToast } from '~/utils/toast.server';

import { action } from './email-invite';

const createUrl = (token?: string) =>
  `http://localhost:3000/organizations/email-invite${token ? `?token=${token}` : ''}`;

const createBody = ({ intent = ACCEPT_EMAIL_INVITE_INTENT } = {}) => ({
  intent,
});

async function sendRequest({
  formData = toFormData(createBody()),
  token,
}: {
  formData?: FormData;
  token?: string;
}) {
  const url = createUrl(token);
  const request = new Request(url, { method: 'POST', body: formData });

  return await action({ request, context: {}, params: {} });
}

async function sendAuthenticatedRequest({
  userAccount,
  formData = toFormData(createBody()),
  token,
}: {
  userAccount: UserAccount;
  formData?: FormData;
  token?: string;
}) {
  const url = createUrl(token);
  const request = await createAuthenticatedRequest({
    url,
    user: userAccount,
    method: 'POST',
    formData,
  });

  return await action({ request, context: {}, params: {} });
}

async function setup() {
  const { organization, user } = await setupUserWithOrgAndAddAsMember();
  const { organization: otherOrganization, user: otherUser } =
    await setupUserWithOrgAndAddAsMember();
  const emailInviteLink = createPopulatedOrganizationEmailInviteLink({
    organizationId: otherOrganization.id,
    invitedById: otherUser.id,
    email: 'test@example.com',
  });
  await saveOrganizationEmailInviteLinkToDatabase(emailInviteLink);
  return { emailInviteLink, organization, otherOrganization, otherUser, user };
}

setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe('/organizations/email-invite route action', () => {
  describe('given: an unauthenticated request', () => {
    test('given: an invalid intent, should: return a 400 status code with an error message', async () => {
      const formData = toFormData({ intent: 'invalid-intent' });

      const actual = await sendRequest({ formData });
      const expected = badRequest({
        errors: {
          intent: {
            message: 'Invalid literal value, expected "acceptEmailInvite"',
          },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('given: an unauthenticated request with no token, should: return a 400 response with an error message and a toast header', async () => {
      const actual = (await sendRequest({})) as ReturnType<typeof badRequest>;
      const expected = badRequest({ error: 'Invalid token' });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Failed to accept invite',
        description: 'The email invite is invalid or has expired',
        type: 'error',
      });
    });

    test('given: an unauthenticated request with an invalid token, should: return a 400 response with an error message', async () => {
      const { token } = createPopulatedOrganizationEmailInviteLink();

      const actual = (await sendRequest({ token })) as ReturnType<
        typeof badRequest
      >;
      const expected = badRequest({ error: 'Invalid token' });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Failed to accept invite',
        description: 'The email invite is invalid or has expired',
        type: 'error',
      });
    });

    test('given: an unauthenticated request with valid token, should: redirect to register page and store token info in session', async () => {
      const { emailInviteLink } = await setup();

      const response = (await sendRequest({
        token: emailInviteLink.token,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual('/register');

      // Verify email invite info was stored in session
      const maybeHeaders = response.headers.get('Set-Cookie');
      const emailInviteInfo = await getEmailInviteInfoFromSession(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? '' },
        }),
      );
      expect(emailInviteInfo).toMatchObject({
        emailInviteToken: emailInviteLink.token,
      });
    });
  });

  describe('given: an authenticated request', () => {
    test('given: an invalid intent, should: return a 400 status code with an error message', async () => {
      const { user } = await setupUserWithOrgAndAddAsMember();
      const formData = toFormData({ intent: 'invalid-intent' });

      const actual = await sendAuthenticatedRequest({
        userAccount: user,
        formData,
      });
      const expected = badRequest({
        errors: {
          intent: {
            message: 'Invalid literal value, expected "acceptEmailInvite"',
          },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('given: an authenticated request with invalid token, should: return a 400 response with an error message and a toast header', async () => {
      const { user } = await setupUserWithOrgAndAddAsMember();
      const { token } = createPopulatedOrganizationEmailInviteLink();

      const actual = (await sendAuthenticatedRequest({
        userAccount: user,
        token,
      })) as ReturnType<typeof badRequest>;
      const expected = badRequest({ error: 'Invalid token' });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Failed to accept invite',
        description: 'The email invite is invalid or has expired',
        type: 'error',
      });
    });

    test('given: an authenticated request with valid token for an organization the user is not a member of, should: add user as member and redirect to organization page', async () => {
      const { emailInviteLink, otherOrganization, user } = await setup();

      const actual = (await sendAuthenticatedRequest({
        userAccount: user,
        token: emailInviteLink.token,
      })) as Response;

      expect(actual.status).toEqual(302);
      expect(actual.headers.get('Location')).toEqual(
        `/organizations/${otherOrganization.slug}/dashboard`,
      );

      // Verify user was added as member
      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            userId: user.id,
            organizationId: otherOrganization.id,
          },
        );
      expect(membership).toMatchObject({
        deactivatedAt: null,
        role: emailInviteLink.role,
      });

      // Verify invite link was deactivated
      const updatedInviteLink = await retrieveEmailInviteLinkFromDatabaseById(
        emailInviteLink.id,
      );
      expect(updatedInviteLink?.deactivatedAt).not.toBeNull();
    });

    test('given: an authenticated request with valid owner role token, should: add user as owner and deactivate the invite link', async () => {
      const { user } = await setupUserWithOrgAndAddAsMember();
      const { organization: otherOrganization, user: otherUser } =
        await setupUserWithOrgAndAddAsMember();

      const ownerEmailInviteLink = createPopulatedOrganizationEmailInviteLink({
        organizationId: otherOrganization.id,
        invitedById: otherUser.id,
        email: user.email,
        role: 'owner',
      });
      await saveOrganizationEmailInviteLinkToDatabase(ownerEmailInviteLink);

      const actual = (await sendAuthenticatedRequest({
        userAccount: user,
        token: ownerEmailInviteLink.token,
      })) as Response;

      expect(actual.status).toEqual(302);
      expect(actual.headers.get('Location')).toEqual(
        `/organizations/${otherOrganization.slug}/dashboard`,
      );

      // Verify user was added as owner
      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            userId: user.id,
            organizationId: otherOrganization.id,
          },
        );
      expect(membership).toMatchObject({
        deactivatedAt: null,
        role: 'owner',
      });

      // Verify invite link was deactivated
      const updatedInviteLink = await retrieveEmailInviteLinkFromDatabaseById(
        ownerEmailInviteLink.id,
      );
      expect(updatedInviteLink?.deactivatedAt).not.toBeNull();
    });

    test('given: an authenticated request with valid token for an organization the user is already a member of, should: redirect to organization page', async () => {
      const { organization, user } = await setupUserWithOrgAndAddAsMember();
      const emailInviteLink = createPopulatedOrganizationEmailInviteLink({
        organizationId: organization.id,
        invitedById: user.id,
        email: user.email,
      });
      await saveOrganizationEmailInviteLinkToDatabase(emailInviteLink);

      const actual = (await sendAuthenticatedRequest({
        userAccount: user,
        token: emailInviteLink.token,
      })) as Response;

      expect(actual.status).toEqual(302);
      expect(actual.headers.get('Location')).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );

      const maybeToast = actual.headers.get('Set-Cookie');
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? '' },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: 'Already a member',
        description: `You are already a member of ${organization.name}`,
        type: 'info',
      });

      // Verify invite link was deactivated even though user was already a member
      const updatedInviteLink = await retrieveEmailInviteLinkFromDatabaseById(
        emailInviteLink.id,
      );
      expect(updatedInviteLink?.deactivatedAt).not.toBeNull();
    });
  });
});
