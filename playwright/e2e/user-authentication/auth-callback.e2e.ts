import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { href } from 'react-router';

import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import { EMAIL_INVITE_INFO_SESSION_NAME } from '~/features/organizations/accept-email-invite/accept-email-invite-constants';
import { INVITE_LINK_INFO_SESSION_NAME } from '~/features/organizations/accept-invite-link/accept-invite-link-constants';
import { saveOrganizationEmailInviteLinkToDatabase } from '~/features/organizations/organizations-email-invite-link-model.server';
import { createPopulatedOrganizationEmailInviteLink } from '~/features/organizations/organizations-factories.server';
import { createPopulatedOrganizationInviteLink } from '~/features/organizations/organizations-factories.server';
import { saveOrganizationInviteLinkToDatabase } from '~/features/organizations/organizations-invite-link-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseByEmail,
} from '~/features/user-accounts/user-accounts-model.server';
import { stringifyAuthCodeData } from '~/test/mocks/handlers/supabase/auth';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import {
  getPath,
  setupEmailInviteCookie,
  setupInviteLinkCookie,
} from '../../utils';

const path = '/auth/callback';

/**
 * Sets up the code verifier cookie required for PKCE flow.
 * This simulates what happens when a user initiates OAuth login.
 */
async function setupCodeVerifierCookie({ page }: { page: Page }) {
  const projectReference =
    process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';

  await page.context().addCookies([
    {
      name: `sb-${projectReference}-auth-token-code-verifier`,
      value: 'test-code-verifier',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

test.describe(`${path} API route`, () => {
  test('given: a valid code for a new user, should: create user account and redirect to onboarding page', async ({
    page,
  }) => {
    // Set up the code verifier cookie first.
    await setupCodeVerifierCookie({ page });

    // Use a code that includes 'google' to simulate Google OAuth. The email
    // will be used to create a mock user in the mock handler.
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Navigate to the callback page with code.
    await page.goto(`${path}?code=${code}`);

    // Verify we're on the onboarding page.
    expect(getPath(page)).toEqual('/onboarding/user-account');

    // Get the created user account from the database.
    // Note: The mock handler for `exchangeCodeForSession` returns a user based
    // on the code.
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();

    // Clean up if user was created.
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
  });

  test('given: a code for an existing user, should: redirect to organizations page', async ({
    page,
  }) => {
    // Create an existing user account first.
    const { user, organization } = await createUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie.
    await setupCodeVerifierCookie({ page });

    const code = stringifyAuthCodeData({
      provider: 'google',
      email: user.email,
      id: user.supabaseUserId,
    });

    // Navigate to callback with code.
    await page.goto(`${path}?code=${code}`);

    // Verify we're on the organizations page.
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a valid code for a new user with an active invite link cookie, should: create their account, add them to the organization, show a success toast, and clear the invite link cookie', async ({
    page,
  }) => {
    // Create organization and invite link
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Generate email for the new user and create auth code
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to onboarding page
    await expect(
      page.getByRole('heading', { name: /onboarding/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(`/onboarding/user-account`);

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(email);

    // Enter the account details
    const { name } = createPopulatedUserAccount();
    await page.getByRole('textbox', { name: /name/i }).fill(name);
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success toast
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a code for an existing user with an active invite link cookie, should: add them to the organization and show success toast', async ({
    page,
  }) => {
    // Create organization and invite link
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Create the existing user that will log in
    const { user: existingUser, organization: existingOrg } =
      await createUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for existing user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: existingUser.email,
      id: existingUser.supabaseUserId,
    });

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to organization dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Verify success toast
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    await teardownOrganizationAndMember({
      user: existingUser,
      organization: existingOrg,
    });
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test("given: a code for an existing user with an active invite link cookie for an organization that the user is already a member of, should: redirect them to the organization's dashboard and show a toast", async ({
    page,
  }) => {
    // Create organization and user who is already a member
    const { organization, user } = await createUserWithOrgAndAddAsMember();

    // Create an invite link for the same organization
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: user.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for the same user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: user.email,
      id: user.supabaseUserId,
    });

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to organization dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(
          new RegExp(`You are already a member of ${organization.name}`, 'i'),
        ),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: no code parameter, should: return an error', async ({
    request,
  }) => {
    // Make request without code.
    const response = await request.get(path);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test('given: an invalid code, should: return an error', async ({
    request,
  }) => {
    // Make request with invalid code.
    const response = await request.get(`${path}?code=invalid_code`);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test('given: a valid code for a new user with an active email invite cookie, should: create their account, add them to the organization, show a success toast, and clear the email invite cookie', async ({
    page,
  }) => {
    // Create organization and email invite
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: invitingUser.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set up the code verifier cookie first.
    await setupCodeVerifierCookie({ page });

    // Generate email for the new user and create auth code
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to onboarding page
    await expect(
      page.getByRole('heading', { name: /onboarding/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(`/onboarding/user-account`);

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(email);

    // Enter the account details
    const { name } = createPopulatedUserAccount();
    await page.getByRole('textbox', { name: /name/i }).fill(name);
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success toast
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify email invite cookie is cleared
    const cookies = await page.context().cookies();
    const emailInviteCookie = cookies.find(
      cookie => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME,
    );
    expect(emailInviteCookie).toBeUndefined();

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a code for an existing user with an active email invite cookie, should: add them to the organization and show success toast', async ({
    page,
  }) => {
    // Create organization and email invite
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: invitingUser.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Create the existing user that will log in
    const { user: existingUser, organization: existingOrg } =
      await createUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for existing user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: existingUser.email,
      id: existingUser.supabaseUserId,
    });

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to organization dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Verify success toast
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify email invite cookie is cleared
    const cookies = await page.context().cookies();
    const emailInviteCookie = cookies.find(
      cookie => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME,
    );
    expect(emailInviteCookie).toBeUndefined();

    // Cleanup
    await teardownOrganizationAndMember({
      user: existingUser,
      organization: existingOrg,
    });
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test("given: a code for an existing user with an active email invite cookie for an organization that the user is already a member of, should: redirect them to the organization's dashboard and show a toast", async ({
    page,
  }) => {
    // Create organization and user who is already a member
    const { organization, user } = await createUserWithOrgAndAddAsMember();

    // Create an email invite for the same organization
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: user.id,
      email: user.email,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for the same user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: user.email,
      id: user.supabaseUserId,
    });

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify redirect to organization dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(
          new RegExp(`You are already a member of ${organization.name}`, 'i'),
        ),
    ).toBeVisible();

    // Verify email invite cookie is cleared
    const cookies = await page.context().cookies();
    const emailInviteCookie = cookies.find(
      cookie => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME,
    );
    expect(emailInviteCookie).toBeUndefined();

    // Cleanup
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a valid code for a new user with an active invite link cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening', async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Create an invite link for this organization
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Generate email for the new user and create auth code
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href('/organizations/invite-link')}?token=${link.token}`,
    );

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(email);

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a valid code for a new user with an active email invite cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening', async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Create an email invite for this organization
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: invitingUser.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Generate email for the new user and create auth code
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href('/organizations/email-invite')}?token=${invite.token}`,
    );

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(email);

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a code for an existing user with an active invite link cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening', async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Create an invite link for this organization
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Create the existing user that will log in
    const { user: existingUser, organization: existingOrg } =
      await createUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for existing user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: existingUser.email,
      id: existingUser.supabaseUserId,
    });

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href('/organizations/invite-link')}?token=${link.token}`,
    );

    // Cleanup
    await teardownOrganizationAndMember({
      user: existingUser,
      organization: existingOrg,
    });
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a code for an existing user with an active email invite cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening', async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Create an email invite for this organization
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: invitingUser.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Create the existing user that will log in
    const { user: existingUser, organization: existingOrg } =
      await createUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie
    await setupCodeVerifierCookie({ page });

    // Create auth code for existing user
    const code = stringifyAuthCodeData({
      provider: 'google',
      email: existingUser.email,
      id: existingUser.supabaseUserId,
    });

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    // Navigate to callback with code
    await page.goto(`${path}?code=${code}`);

    // Verify toast message
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href('/organizations/email-invite')}?token=${invite.token}`,
    );

    // Cleanup
    await teardownOrganizationAndMember({
      user: existingUser,
      organization: existingOrg,
    });
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });
});
