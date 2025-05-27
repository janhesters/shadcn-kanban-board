import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { EMAIL_INVITE_INFO_SESSION_NAME } from '~/features/organizations/accept-email-invite/accept-email-invite-constants';
import { INVITE_LINK_INFO_SESSION_NAME } from '~/features/organizations/accept-invite-link/accept-invite-link-constants';
import { saveOrganizationEmailInviteLinkToDatabase } from '~/features/organizations/organizations-email-invite-link-model.server';
import {
  createPopulatedOrganization,
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
} from '~/features/organizations/organizations-factories.server';
import { saveOrganizationInviteLinkToDatabase } from '~/features/organizations/organizations-invite-link-model.server';
import { deleteOrganizationFromDatabaseById } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { createUserWithOrgAndAddAsMember } from '~/test/test-utils';

import {
  getPath,
  loginByCookie,
  setupEmailInviteCookie,
  setupInviteLinkCookie,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/login';

test.describe('login page', () => {
  test('given: a logged in user without an account, should: redirect to the login page and log the user out', async ({
    page,
  }) => {
    await loginByCookie({ page });

    await page.goto(path);

    // Verify redirect to login page
    expect(getPath(page)).toEqual('/login');

    // Verify auth cookie is cleared
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(cookie =>
      cookie.name.includes('-auth-token'),
    );
    expect(authCookie).toBeUndefined();
  });

  test("given: a logged in and onboarded user, should: redirect to the organization's page", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    // Verify redirect to login page
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });

  test('given: a logged out user, should: have the correct title and show the link to the register page', async ({
    page,
  }) => {
    await page.goto(path);

    // The page title is correct.
    await expect(page).toHaveTitle(/login | react router saas template/i);

    // The register button has the correct link.
    await expect(page.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  test.describe('email login', () => {
    test('given: a logged out user entering invalid data, should: show the correct error messages', async ({
      page,
    }) => {
      await page.goto(path);

      // Invalid email.
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      const loginButton = page.getByRole('button', { name: /login/i });
      await expect(loginButton).toBeVisible();
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      await emailInput.fill('invalid@email');
      await loginButton.click();
      await expect(
        page.getByText(/a valid email consists of characters, '@' and '.'./i),
      ).toBeVisible();

      // User does not exist.
      await emailInput.fill(createPopulatedUserAccount().email);
      await loginButton.click();
      await expect(
        page.getByText(
          /user with given email doesn't exist. did you mean to create a new account instead?/i,
        ),
      ).toBeVisible();
    });

    test('given: a logged out user with an existing account, should: log the user in', async ({
      page,
    }) => {
      const userAccount = createPopulatedUserAccount();
      await saveUserAccountToDatabase(userAccount);

      await page.goto(path);

      // Fill in the email and click the login button.
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      const loginButton = page.getByRole('button', { name: /login/i });
      await expect(loginButton).toBeVisible();
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(userAccount.email);
      await loginButton.click();

      // Check that the magic link verification form is shown. The button
      // should be disabled because you can only request a new link every 60
      // seconds.
      await expect(page.getByText(/check your email/i)).toBeVisible();
      await expect(
        page.getByText(
          /if you haven't received the email within 60 seconds, you may request another link./i,
        ),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /request new login link/i }),
      ).toBeDisabled();

      await deleteUserAccountFromDatabaseById(userAccount.id);
    });
  });

  test.describe('google login', () => {
    test('given: a logged out user, should: redirect to the google login page', async ({
      page,
    }) => {
      await page.goto(path);

      // Click the Google login button.
      const googleLoginButton = page.getByRole('button', {
        name: /google/i,
      });
      await googleLoginButton.click();

      // Check that the user is redirected to the google login page.
      await expect(
        page.getByRole('heading', { name: /sign in/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/sign in with google/i)).toBeVisible();
    });
  });

  test('given: an anonymous user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('given: an anonymous user with an active invite link in their cookies, should: show text letting the user know they will join the organization after logging in', async ({
    page,
  }) => {
    const { organization, user } = await createUserWithOrgAndAddAsMember({
      organization: createPopulatedOrganization({
        name: "Moore, O'Hara and Gerlach",
      }),
    });
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: user.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    await page.goto(path);

    await expect(
      page.getByText(new RegExp(`log in to join ${organization.name}`, 'i')),
    ).toBeVisible();
    await expect(
      page.getByText(
        new RegExp(
          `${user.name} has invited you to join ${organization.name}`,
          'i',
        ),
      ),
    ).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });

  test('given: an anonymous user with an inactive invite link in their cookies, should: NOT show any text about joining an organization and also clear the invite link cookie', async ({
    page,
  }) => {
    const { organization, user } = await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: user.id,
      deactivatedAt: new Date(),
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { inviteLinkToken: link.token, expiresAt: link.expiresAt },
    });

    await page.goto(path);

    // Check that the normal login text is shown instead of the invite text
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Verify that the invite-specific text is not shown
    await expect(
      page.getByText(new RegExp(`log in to join ${organization.name}`, 'i')),
    ).not.toBeVisible();
    await expect(
      page.getByText(
        new RegExp(
          `${user.name} has invited you to join ${organization.name}`,
          'i',
        ),
      ),
    ).not.toBeVisible();

    // Verify that the invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });

  test('given: an anonymous user with an active email invite in their cookies, should: show text letting the user know they will join the organization after logging in', async ({
    page,
  }) => {
    const { organization, user } = await createUserWithOrgAndAddAsMember({
      organization: createPopulatedOrganization({
        name: "Moore, O'Hara and Gerlach",
      }),
    });
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: user.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
    });

    await page.goto(path);

    await expect(
      page.getByText(new RegExp(`log in to join ${organization.name}`, 'i')),
    ).toBeVisible();
    await expect(
      page.getByText(
        new RegExp(
          `${user.name} has invited you to join ${organization.name}`,
          'i',
        ),
      ),
    ).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });

  test('given: an anonymous user with an inactive email invite in their cookies, should: NOT show any text about joining an organization and also clear the email invite cookie', async ({
    page,
  }) => {
    const { organization, user } = await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: user.id,
      deactivatedAt: new Date(),
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set the email invite cookie
    await setupEmailInviteCookie({
      page,
      invite: { emailInviteToken: invite.id, expiresAt: invite.expiresAt },
    });

    await page.goto(path);

    // Check that the normal login text is shown instead of the invite text
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Verify that the invite-specific text is not shown
    await expect(
      page.getByText(new RegExp(`log in to join ${organization.name}`, 'i')),
    ).not.toBeVisible();
    await expect(
      page.getByText(
        new RegExp(
          `${user.name} has invited you to join ${organization.name}`,
          'i',
        ),
      ),
    ).not.toBeVisible();

    // Verify that the email invite cookie is cleared
    const cookies = await page.context().cookies();
    const emailInviteCookie = cookies.find(
      cookie => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME,
    );
    expect(emailInviteCookie).toBeUndefined();

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });
});
