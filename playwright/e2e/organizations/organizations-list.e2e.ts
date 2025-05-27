import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { OrganizationMembershipRole } from '@prisma/client';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { deleteUserAccountFromDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/organizations';

test.describe('organizations list page', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in user who is NOT onboarded, should: redirect to onboarding page', async ({
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

  test('given: a logged in user with one organization, should: redirect to that organization', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: a logged in user with multiple organizations, should: show the organizations list with correct role badges', async ({
    page,
  }) => {
    // Create and login with a user that will be a member in multiple organizations
    const { organization: firstOrg, user } =
      await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.member,
      });

    // Create a second organization where the user will be an admin
    const secondOrg = await saveOrganizationToDatabase(
      createPopulatedOrganization(),
    );
    await addMembersToOrganizationInDatabaseById({
      id: secondOrg.id,
      members: [user.id],
      role: OrganizationMembershipRole.admin,
    });

    // Create a third organization where the user will be an owner
    const thirdOrg = await saveOrganizationToDatabase(
      createPopulatedOrganization(),
    );
    await addMembersToOrganizationInDatabaseById({
      id: thirdOrg.id,
      members: [user.id],
      role: OrganizationMembershipRole.owner,
    });

    // Go to organizations list
    await page.goto(path);

    // Verify page content
    await expect(page).toHaveTitle(/organization list/i);
    await expect(
      page.getByRole('heading', { name: /organization list/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/your organizations/i)).toBeVisible();
    await expect(
      page.getByText(
        /this is a list of all the organizations you're a member of/i,
      ),
    ).toBeVisible();

    // Verify organizations are listed
    const organizationsList = page.getByRole('list');
    await expect(organizationsList).toBeVisible();

    // Verify first organization (member)
    const firstOrgLink = organizationsList.getByRole('link', {
      name: firstOrg.name,
    });
    await expect(firstOrgLink).toBeVisible();
    await expect(firstOrgLink).toHaveAttribute(
      'href',
      `/organizations/${firstOrg.slug}`,
    );
    await expect(organizationsList.getByText(/member/i)).toBeVisible();

    // Verify second organization (admin)
    const secondOrgLink = organizationsList.getByRole('link', {
      name: secondOrg.name,
    });
    await expect(secondOrgLink).toBeVisible();
    await expect(secondOrgLink).toHaveAttribute(
      'href',
      `/organizations/${secondOrg.slug}`,
    );
    await expect(organizationsList.getByText(/admin/i)).toBeVisible();

    // Verify third organization (owner)
    const thirdOrgLink = organizationsList.getByRole('link', {
      name: thirdOrg.name,
    });
    await expect(thirdOrgLink).toBeVisible();
    await expect(thirdOrgLink).toHaveAttribute(
      'href',
      `/organizations/${thirdOrg.slug}`,
    );
    await expect(organizationsList.getByText(/owner/i)).toBeVisible();

    // Cleanup
    await teardownOrganizationAndMember({ organization: firstOrg, user });
    await deleteOrganizationFromDatabaseById(secondOrg.id);
    await deleteOrganizationFromDatabaseById(thirdOrg.id);
  });

  test('given: a logged in user with multiple organizations, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    // Create and login with a user that will be a member in multiple organizations
    const { organization: firstOrg, user } =
      await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.member,
      });

    // Create a second organization where the user will be an admin
    const secondOrg = await saveOrganizationToDatabase(
      createPopulatedOrganization(),
    );
    await addMembersToOrganizationInDatabaseById({
      id: secondOrg.id,
      members: [user.id],
      role: OrganizationMembershipRole.admin,
    });

    // Create a third organization where the user will be an owner
    const thirdOrg = await saveOrganizationToDatabase(
      createPopulatedOrganization(),
    );
    await addMembersToOrganizationInDatabaseById({
      id: thirdOrg.id,
      members: [user.id],
      role: OrganizationMembershipRole.owner,
    });

    // Go to organizations list
    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Cleanup
    await teardownOrganizationAndMember({ organization: firstOrg, user });
    await deleteOrganizationFromDatabaseById(secondOrg.id);
    await deleteOrganizationFromDatabaseById(thirdOrg.id);
  });
});
