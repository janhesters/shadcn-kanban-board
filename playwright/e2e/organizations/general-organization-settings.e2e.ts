import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { OrganizationMembershipRole } from '@prisma/client';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { retrieveOrganizationFromDatabaseById } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { deleteUserAccountFromDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import {
  enableClientMswMocks,
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

test.describe('general organization settings', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    await page.goto(`/organizations/${slug}/settings/general`);

    const searchParameters = new URLSearchParams();
    searchParameters.append(
      'redirectTo',
      `/organizations/${slug}/settings/general`,
    );
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in user who is NOT onboarded, should: redirect to the onboarding page', async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(`/organizations/${slug}/settings/general`);

    expect(getPath(page)).toEqual('/onboarding/user-account');

    await deleteUserAccountFromDatabaseById(id);
  });

  test('given: a logged in user who is NOT a member of the organization, should: show a 404 not found page', async ({
    page,
  }) => {
    const { organization, user: otherUser } =
      await createUserWithOrgAndAddAsMember();
    const { organization: otherOrganization, user } =
      await setupOrganizationAndLoginAsMember({ page });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    await expect(
      page.getByRole('heading', { name: /page not found/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(
      page.getByText(/sorry, we couldn't find the page you're looking for/i),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /return home/i }),
    ).toHaveAttribute('href', '/');
    expect(await page.title()).toMatch(/404|react router saas template/i);

    await teardownOrganizationAndMember({
      user,
      organization: otherOrganization,
    });
    await teardownOrganizationAndMember({ user: otherUser, organization });
  });

  test('given: a logged in user who is onboarded and a member, should: show read-only organization info', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    // Verify page content
    await expect(page).toHaveTitle(/general | react router saas template/i);
    await expect(
      page.getByText(/general settings for this organization/i),
    ).toBeVisible();

    // Verify read-only organization info
    await expect(page.getByText(/organization name/i)).toBeVisible();
    await expect(page.getByText(organization.name).nth(1)).toBeVisible();
    await expect(page.getByText(/organization logo/i)).toBeVisible();
    await expect(
      page.getByRole('img', { name: /organization logo/i }),
    ).toBeVisible();

    // Verify no edit controls are visible
    await expect(
      page.getByRole('button', { name: /save changes/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete organization/i }),
    ).not.toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: a logged in user who is onboarded and an admin, should: show read-only organization info', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.admin,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    // Verify page content
    await expect(page).toHaveTitle(/general | react router saas template/i);
    await expect(
      page.getByText(/general settings for this organization/i),
    ).toBeVisible();

    // Verify read-only organization info
    await expect(page.getByText(/organization name/i)).toBeVisible();
    await expect(page.getByText(organization.name).nth(1)).toBeVisible();
    await expect(page.getByText(/organization logo/i)).toBeVisible();
    await expect(
      page.getByRole('img', { name: /organization logo/i }),
    ).toBeVisible();

    // Verify no edit controls are visible
    await expect(
      page.getByRole('button', { name: /save changes/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete organization/i }),
    ).not.toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test.describe('given: a logged in user who is onboarded and an owner', () => {
    test('given: valid organization name and logo, should: update organization name and logo', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });

      await enableClientMswMocks({ page });

      await page.goto(`/organizations/${organization.slug}/settings/general`);

      // Verify page content
      await expect(page).toHaveTitle(/general | react router saas template/i);
      await expect(
        page.getByText(/general settings for this organization/i),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /team members/i }),
      ).toHaveAttribute(
        'href',
        `/organizations/${organization.slug}/settings/members`,
      );
      await expect(
        page.getByRole('textbox', { name: /organization name/i }),
      ).toBeVisible();

      // Enter organization name first time
      const newName = createPopulatedOrganization().name;
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

      // Enter name again to ensure form is ready
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

      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click();

      // Verify loading state
      await expect(
        page.getByRole('button', { name: /saving changes/i }),
      ).toBeVisible();

      // Verify success toast
      await expect(
        page
          .getByRole('region', { name: /notifications/i })
          .getByText(/organization has been updated/i),
      ).toBeVisible();

      // Verify database update
      const updatedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(updatedOrganization?.name).toEqual(newName);
      expect(updatedOrganization?.imageUrl).toContain('200x200.jpg');

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given: invalid inputs, should: show validation errors', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });

      await page.goto(`/organizations/${organization.slug}/settings/general`);

      // Verify page content
      await expect(page).toHaveTitle(/general | react router saas template/i);
      await expect(
        page.getByText(/general settings for this organization/i),
      ).toBeVisible();
      await expect(
        page.getByText(/your organization's public display name/i),
      ).toBeVisible();

      // Verify form elements
      await expect(
        page.getByRole('textbox', { name: /organization name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /save changes/i }),
      ).toBeVisible();

      // Test whitespace name
      await page.getByRole('textbox', { name: /organization name/i }).clear();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill('   a   ');
      await page.getByRole('button', { name: /save changes/i }).click();
      await expect(
        page.getByText(/organization name must be at least 3 characters long/i),
      ).toBeVisible();

      // Test too long name
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(faker.string.alpha(256));
      await expect(
        page.getByText(
          /organization name must be less than 255 characters long/i,
        ),
      ).toBeVisible();
      await page.getByRole('button', { name: /save changes/i }).click();

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given: delete organization button is clicked, should: show confirmation dialog and allow organization deletion if the user types in the organization's name as confirmation", async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });

      await page.goto(`/organizations/${organization.slug}/settings/general`);

      // Open delete dialog
      await page.getByRole('button', { name: /delete organization/i }).click();

      // Verify dialog content
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /delete organization/i, level: 2 }),
      ).toBeVisible();
      await expect(
        page.getByText(/are you sure you want to delete this organization/i),
      ).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /delete organization/i }).click();
      await expect(
        page.getByRole('button', { name: /delete this organization/i }),
      ).toBeDisabled();
      const confirmationInput = page.getByRole('textbox', {
        name: new RegExp(
          `to confirm, type "${organization.name}" in the box below`,
          'i',
        ),
      });
      // Typing in anything less than the organization's name should keep the
      // delete button disabled
      await confirmationInput.fill(organization.name.slice(0, -1));
      await expect(
        page.getByRole('button', { name: /delete this organization/i }),
      ).toBeDisabled();
      // Typing in the name but messing up its capitalization should keep the
      // delete button disabled
      await confirmationInput.clear();
      await confirmationInput.fill(organization.name.toLowerCase());
      await expect(
        page.getByRole('button', { name: /delete this organization/i }),
      ).toBeDisabled();
      // Typing in the organization's name should enable the delete button
      await confirmationInput.clear();
      await confirmationInput.fill(organization.name);
      await page
        .getByRole('button', { name: /delete this organization/i })
        .click();

      // Verify loading state
      await expect(
        page.getByRole('button', { name: /deleting organization/i }),
      ).toBeVisible();

      // Since the user no longer has an organization, they should be redirected
      // to the onboarding page
      await expect(page).toHaveURL('/onboarding/organization');

      // Verify organization was deleted
      const deletedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(deletedOrganization).toBeNull();

      await deleteUserAccountFromDatabaseById(user.id);
    });
  });

  test('given: a logged in user who is onboarded and a member of the organization, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });
});
