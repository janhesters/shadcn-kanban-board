import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { OrganizationMembershipRole } from '@prisma/client';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { retrieveOrganizationWithMembershipsFromDatabaseBySlug } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { deleteUserAccountFromDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import {
  enableClientMswMocks,
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/onboarding/organization';

test.describe('onboarding organization page', () => {
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

  test('given: a logged in user without name, should: redirect to user account onboarding', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual('/onboarding/user-account');

    await deleteUserAccountFromDatabaseById(id);
  });

  test.describe('organization creation', () => {
    test('given: a logged in user with name but no organization, should: allow organization creation with name and logo and redirect to organization page', async ({
      page,
    }) => {
      const user = await loginAndSaveUserAccountToDatabase({ page });

      await enableClientMswMocks({ page });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /organization | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your organization/i)).toBeVisible();
      await expect(
        page.getByText(
          /you can invite other users to join your organization later/i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /organization/i }),
      ).toHaveAttribute('aria-current', 'step');

      // Enter organization name
      const { name: newName, slug: newSlug } = createPopulatedOrganization();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

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

      // Enter name again. Sometimes with MSW activated on the server,
      // it takes time for the fields to become available, so we do it twice
      // to make sure the test isn't flaky.
      await page.getByRole('textbox', { name: /organization name/i }).clear();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

      // Perform drag and drop of the image again for the same reason
      await page.setInputFiles(
        'input[type="file"]',
        'playwright/fixtures/200x200.jpg',
      );
      await expect(page.getByText('200x200.jpg')).toBeVisible();

      // Create organization
      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member.id).toEqual(user.id);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      await deleteUserAccountFromDatabaseById(user.id);
    });

    test('given: a logged in user with name but no organization, should: allow organization creation with only name and redirect to organization page', async ({
      page,
    }) => {
      const user = await loginAndSaveUserAccountToDatabase({ page });

      await enableClientMswMocks({ page });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /organization | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your organization/i)).toBeVisible();
      await expect(
        page.getByText(
          /you can invite other users to join your organization later/i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /organization/i }),
      ).toHaveAttribute('aria-current', 'step');

      // Verify page content
      await expect(
        page.getByRole('textbox', { name: /organization name/i }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /save/i })).toBeVisible();

      // Enter organization name
      const { name: newName, slug: newSlug } = createPopulatedOrganization();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

      // Create organization
      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member.id).toEqual(user.id);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      await deleteUserAccountFromDatabaseById(user.id);
    });

    test('given: a logged in user with name but no organization, should: show validation errors for invalid input', async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({ page });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /organization | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your organization/i)).toBeVisible();
      await expect(
        page.getByText(
          /you can invite other users to join your organization later/i,
        ),
      ).toBeVisible();

      const nameInput = page.getByRole('textbox', {
        name: /organization name/i,
      });
      const saveButton = page.getByRole('button', { name: /save/i });

      // Test whitespace name
      await nameInput.fill('   a   ');
      await saveButton.click();
      await expect(
        page.getByText(
          /your organization name must be at least 3 characters long./i,
        ),
      ).toBeVisible();

      // Test too long name
      await nameInput.fill(faker.string.alpha(256));
      await expect(
        page.getByText(
          /your organization name must be at most 255 characters long./i,
        ),
      ).toBeVisible();
      await saveButton.click();

      await deleteUserAccountFromDatabaseById(id);
    });
  });

  test('given: an authenticated user that has not completed onboarding, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(id);
  });
});
