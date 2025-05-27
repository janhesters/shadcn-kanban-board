import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import { expect, test } from '@playwright/test';
import { OrganizationMembershipRole } from '@prisma/client';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationWithMembershipsFromDatabaseBySlug,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { deleteUserAccountFromDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import {
  enableClientMswMocks,
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/organizations/new';

test.describe('new organization page', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in user who is NOT onboarded, should: still allow the user to create an organization', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual('/organizations/new');

    await deleteUserAccountFromDatabaseById(id);
  });

  test.describe('organization creation', () => {
    test('given: a logged in and onboarded user who visits the url directly, should: show a header, allow organization creation with name and logo and redirect to organization page', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await enableClientMswMocks({ page });

      await page.goto(path);

      // Verify page content
      await expect(
        page.getByRole('heading', { name: /new organization/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
        'href',
        '/organizations',
      );
      await expect(page).toHaveTitle(
        /new organization | react router saas template/i,
      );
      await expect(page.getByText(/create a new organization/i)).toBeVisible();
      await expect(
        page.getByText(/tell us about your organization/i),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /open theme menu/i }),
      ).toBeVisible();
      const termsLink = page.getByRole('link', { name: /terms of service/i });
      const privacyLink = page.getByRole('link', { name: /privacy policy/i });
      await expect(termsLink).toHaveAttribute('href', '/terms-of-service');
      await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');

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
      await expect(page.getByText('200x200.jpg')).toBeVisible();

      // Enter name again. Sometimes with MSW activated on the server,
      // it takes time for the fields to become available, so we do it twice
      // to make sure the test isn't flaky.
      await page.getByRole('textbox', { name: /organization name/i }).clear();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

      // Create organization
      await page.getByRole('button', { name: /create organization/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      await expect(
        page.getByRole('button', { name: new RegExp(newName, 'i') }),
      ).toBeVisible();

      // Verify that the organization was created
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member).toEqual(user);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      await teardownOrganizationAndMember({ organization, user });
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test('given: a logged in and onboarded user who visits the url directly, should: show a header, allow organization creation with only name and redirect to organization page', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await enableClientMswMocks({ page });

      await page.goto(path);

      // Verify page content
      await expect(
        page.getByRole('heading', { name: /new organization/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
        'href',
        '/organizations',
      );
      await expect(page).toHaveTitle(
        /new organization | react router saas template/i,
      );
      await expect(page.getByText(/create a new organization/i)).toBeVisible();
      await expect(
        page.getByText(/tell us about your organization/i),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /open theme menu/i }),
      ).toBeVisible();
      const termsLink = page.getByRole('link', { name: /terms of service/i });
      const privacyLink = page.getByRole('link', { name: /privacy policy/i });
      await expect(termsLink).toHaveAttribute('href', '/terms-of-service');
      await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');

      // Verify form elements
      await expect(page.locator('input[type="file"]')).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /organization name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /create organization/i }),
      ).toBeVisible();

      // Enter organization name
      const { name: newName, slug: newSlug } = createPopulatedOrganization();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

      // Enter the name again because sometimes with MSW activated on the server,
      // it takes time for the fields to become available, so we do it twice
      // to make sure the test isn't flaky.
      await page.getByRole('textbox', { name: /organization name/i }).clear();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);

      // Create organization
      await page.getByRole('button', { name: /create organization/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      await expect(
        page.getByRole('button', { name: new RegExp(newName, 'i') }),
      ).toBeVisible();

      // Verify that the organization was created
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member).toEqual(user);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      await teardownOrganizationAndMember({ organization, user });
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test('given: a logged in onboarded user, who creates the new orginazation using the organization switcher: should: allow organization creation with name and logo and redirect to organization page', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await page.goto(`/organizations/${organization.slug}`);

      await page
        .getByRole('button', { name: new RegExp(organization.name, 'i') })
        .click();
      await page.getByRole('link', { name: /new organization/i }).click();

      // Verify page content
      await expect(page).toHaveTitle(
        /new organization | react router saas template/i,
      );
      await expect(page.getByText(/create a new organization/i)).toBeVisible();
      await expect(
        page.getByText(/tell us about your organization/i),
      ).toBeVisible();

      // Create organization
      const { name: newName, slug: newSlug } = createPopulatedOrganization();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);
      await page.getByRole('button', { name: /create organization/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);

      // Verify that the organization was created
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member).toEqual(user);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      // Verify that the sidebar has the new organization
      await expect(
        page.getByRole('button', { name: new RegExp(newName, 'i') }),
      ).toBeVisible();

      await teardownOrganizationAndMember({ organization, user });
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test('given: a logged in onboarded user, who creates the new orginazation using the organization switcher: should: allow organization creation with only name and redirect to organization page', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await page.goto(`/organizations/${organization.slug}`);

      await page
        .getByRole('button', { name: new RegExp(organization.name, 'i') })
        .click();
      await page.getByRole('link', { name: /new organization/i }).click();

      // Verify page content
      await expect(page).toHaveTitle(
        /new organization | react router saas template/i,
      );
      await expect(page.getByText(/create a new organization/i)).toBeVisible();
      await expect(
        page.getByText(/tell us about your organization/i),
      ).toBeVisible();

      // Create organization
      const { name: newName, slug: newSlug } = createPopulatedOrganization();
      await page
        .getByRole('textbox', { name: /organization name/i })
        .fill(newName);
      await page.getByRole('button', { name: /create organization/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);

      // Verify that the organization was created
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization!.memberships[0].member).toEqual(user);
      expect(createdOrganization!.memberships[0].role).toEqual(
        OrganizationMembershipRole.owner,
      );

      // Verify that the sidebar has the new organization
      await expect(
        page.getByRole('button', { name: new RegExp(newName, 'i') }),
      ).toBeVisible();

      await teardownOrganizationAndMember({ organization, user });
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test('given: a logged in and onboarded user, should: show validation errors for invalid input', async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /new organization | react router saas template/i,
      );
      await expect(page.getByText(/create a new organization/i)).toBeVisible();
      await expect(
        page.getByText(/tell us about your organization/i),
      ).toBeVisible();

      const nameInput = page.getByRole('textbox', {
        name: /organization name/i,
      });
      const submitButton = page.getByRole('button', {
        name: /create organization/i,
      });

      // Test whitespace name
      await nameInput.fill('   a   ');
      await submitButton.click();
      await expect(
        page.getByText(/organization name must be at least 3 characters long/i),
      ).toBeVisible();

      // Test too long name
      await nameInput.fill(faker.string.alpha(256));
      await expect(
        page.getByText(
          /organization name must be less than 255 characters long/i,
        ),
      ).toBeVisible();
      await submitButton.click();

      await teardownOrganizationAndMember({ organization, user });
    });
  });

  test('given: a logged in and onboarded user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });
});
