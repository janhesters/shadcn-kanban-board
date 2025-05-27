import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseById,
} from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import {
  enableClientMswMocks,
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/onboarding/user-account';

test.describe('onboarding user account page', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in and onboarded user, should: redirect to organization page', async ({
    page,
  }) => {
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a logged in user with name but no organization, should: redirect to organization onboarding', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount(),
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual('/onboarding/organization');

    await deleteUserAccountFromDatabaseById(id);
  });

  test.describe('user profile creation', () => {
    test('given: a logged in user without name and no organization, should: allow name and avatar creation and redirect to organization onboarding', async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({
        user: createPopulatedUserAccount({ name: '', imageUrl: '' }),
        page,
      });

      await enableClientMswMocks({ page });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      // Verify form elements
      await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

      // Create profile
      const newName = createPopulatedUserAccount().name;
      await page.getByRole('textbox', { name: /name/i }).fill(newName);

      // Test image upload via drag and drop
      const dropzone = page.getByText(
        /drag and drop or select file to upload/i,
      );
      await expect(dropzone).toBeVisible();

      // Perform drag and drop of the image
      await page.setInputFiles(
        'input[type="file"]',
        'playwright/fixtures/200x200.jpg',
      );
      await expect(page.getByText('200x200.jpg')).toBeVisible();

      // Enter name again. Sometimes with MSW activated on the server,
      // it takes time for the fields to become available, so we do it twice
      // to make sure the test isn't flaky.
      await page.getByRole('textbox', { name: /name/i }).clear();
      await page.getByRole('textbox', { name: /name/i }).fill(newName);

      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(page.getByText(/create your organization/i)).toBeVisible();
      const updatedUser = await retrieveUserAccountFromDatabaseById(id);
      expect(updatedUser?.name).toEqual(newName);
      expect(updatedUser?.imageUrl).toContain('200x200.jpg');

      await deleteUserAccountFromDatabaseById(id);
    });

    test('given: a logged in user without name but with organization, should: allow name creation and redirect to organization page', async ({
      page,
    }) => {
      const { user, organization } = await setupOrganizationAndLoginAsMember({
        page,
        user: createPopulatedUserAccount({ name: '' }),
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps - only user account step should be shown
      const onboardingNav = page.getByRole('navigation', {
        name: /onboarding progress/i,
      });
      await expect(onboardingNav).toBeVisible();
      await expect(
        onboardingNav.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      // It ONLY shows the user account step and hides the organization step.
      await expect(onboardingNav.getByText(/organization/i)).not.toBeVisible();

      // Create profile
      const newName = createPopulatedUserAccount().name;
      await page.getByRole('textbox', { name: /name/i }).fill(newName);
      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);

      await teardownOrganizationAndMember({ user, organization });
    });

    test('given: a logged in user without name and without an organization, should: show validation errors for invalid input', async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({
        user: createPopulatedUserAccount({ name: '' }),
        page,
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      const onboardingNav = page.getByRole('navigation', {
        name: /onboarding progress/i,
      });
      await expect(onboardingNav).toBeVisible();
      await expect(
        onboardingNav.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      // If the user lacks an organization, the organization step should be
      // shown.
      await expect(onboardingNav.getByText(/organization/i)).toBeVisible();

      const nameInput = page.getByRole('textbox', { name: /name/i });
      const saveButton = page.getByRole('button', { name: /save/i });

      // Test whitespace name
      await nameInput.fill('   a   ');
      await saveButton.click();
      await expect(
        page.getByText(/your name must be at least 2 characters long./i),
      ).toBeVisible();

      // Test too long name
      await nameInput.fill('a'.repeat(129));
      await expect(
        page.getByText(/your name must be at most 128 characters long./i),
      ).toBeVisible();
      await saveButton.click();

      await deleteUserAccountFromDatabaseById(id);
    });
  });

  test('given: an authenticated user that has not completed onboarding, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(id);
  });
});
