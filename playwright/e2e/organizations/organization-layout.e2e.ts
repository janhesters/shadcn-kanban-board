import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
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

test.describe('organization layout', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    await page.goto(`/organizations/${slug}`);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', `/organizations/${slug}/dashboard`);
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

    await page.goto(`/organizations/${slug}`);

    expect(getPath(page)).toEqual('/onboarding/user-account');

    await deleteUserAccountFromDatabaseById(id);
  });

  test('given: a logged in user who is onboarded and a member of the organization, should: redirect to the dashboard page', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}`);

    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: a logged in user who is onboarded but NOT a member of the organization, should: show a 404 not found page', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });
    const otherOrganization = createPopulatedOrganization();
    await saveOrganizationToDatabase(otherOrganization);

    await page.goto(`/organizations/${otherOrganization.slug}`);

    // Verify 404 page content
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
    await expect(page).toHaveTitle(/404/i);

    await teardownOrganizationAndMember({ organization, user });
    await deleteOrganizationFromDatabaseById(otherOrganization.id);
  });

  test('given: a logged in user who is onboarded and a member of the organization, should: show the correct layout components', async ({
    page,
    isMobile,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/dashboard`);

    // Verify header.
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();

    // Verify sidebar

    if (isMobile) {
      // On mobile, open the burger menu
      await page.getByRole('button', { name: /open sidebar/i }).click();
    }

    const sidebarNav = page.getByRole('navigation', { name: /sidebar/i });
    await expect(sidebarNav).toBeVisible();
    await expect(
      sidebarNav.getByRole('link', { name: /dashboard/i }),
    ).toHaveAttribute('href', `/organizations/${organization.slug}/dashboard`);
    await expect(
      sidebarNav.getByRole('link', { name: /settings/i }),
    ).toHaveAttribute('href', `/organizations/${organization.slug}/settings`);

    // Verify user menu
    await page.getByRole('button', { name: /open user menu/i }).click();
    await expect(page.getByRole('link', { name: /account/i })).toHaveAttribute(
      'href',
      '/settings/account',
    );
    await expect(
      page.getByRole('menuitem', { name: /log out/i }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    if (isMobile) {
      // On mobile, close the burger menu
      await page.getByRole('button', { name: /close sidebar/i }).click();
    }

    await teardownOrganizationAndMember({ organization, user });
  });

  test('given: a logged in user who is onboarded and a member of the organization, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/dashboard`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });

  test.describe('theme toggle', () => {
    test('given: a logged in user who is onboarded and a member of the organization, should: let the user switch the theme', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await page.goto(`/organizations/${organization.slug}/dashboard`);

      // Check that no dark class is present initially
      const htmlElement = page.locator('html');
      await expect(htmlElement).not.toHaveClass('dark');

      await page.getByRole('button', { name: /open theme menu/i }).click();
      await page.getByRole('menuitem', { name: /dark/i }).click();

      // Check that the dark button is disabled.
      await page.getByRole('button', { name: /open theme menu/i }).click();
      await expect(
        page.getByRole('menuitem', { name: /dark/i }),
      ).toBeDisabled();

      // Check that dark class is present after switching and the user is
      // still on the same page.
      await expect(htmlElement).toHaveClass('dark');
      await expect(page).toHaveURL(
        `/organizations/${organization.slug}/dashboard`,
      );

      // Check that after reloading the page, the dark class is still present.
      await page.reload();
      await expect(htmlElement).toHaveClass('dark');

      await teardownOrganizationAndMember({ organization, user });
    });
  });
});
