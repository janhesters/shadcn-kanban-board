/* eslint-disable unicorn/consistent-function-scoping */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { OrganizationInviteLink } from '@prisma/client';
import { promiseHash } from 'remix-utils/promise';

import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import { createPopulatedOrganizationInviteLink } from '~/features/organizations/organizations-factories.server';
import { saveOrganizationInviteLinkToDatabase } from '~/features/organizations/organizations-invite-link-model.server';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import { getPath, setupOrganizationAndLoginAsMember } from '../../utils';

const getInviteLinkPagePath = (token?: string) =>
  `/organizations/invite-link${token ? `?token=${token}` : ''}`;

test.describe('organizations invite link page', () => {
  test.describe('given: a logged out user', () => {
    async function setup(
      deactivatedAt?: OrganizationInviteLink['deactivatedAt'],
    ) {
      const { user, organization } = await createUserWithOrgAndAddAsMember();
      const link = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        deactivatedAt,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return { link, organization, user };
    }

    test('given: an invalid token, should: show a 404 page', async ({
      page,
    }) => {
      const { user, organization } = await setup();

      await page.goto(getInviteLinkPagePath('invalid-token'));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given: a valid token, should: redirect to the register page', async ({
      page,
    }) => {
      const { link, user, organization } = await setup();

      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button.
      await page.getByRole('button', { name: /accept invite/i }).click();

      // The page title is correct.
      await expect(page).toHaveTitle(/register | react router saas template/i);
      await expect(
        page.getByText(
          new RegExp(`register to join ${organization.name}`, 'i'),
        ),
      ).toBeVisible();
      await expect(
        page.getByText(
          new RegExp(
            `${user.name} has invited you to join ${organization.name}`,
            'i',
          ),
        ),
      ).toBeVisible();

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given: a valid token for a deactivated invite link, should: show a 404 page ', async ({
      page,
    }) => {
      const { link, user, organization } = await setup(new Date());

      await page.goto(getInviteLinkPagePath(link.token));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given a valid token, should: lack any automatically detectable accessibility issues', async ({
      page,
    }) => {
      const data = await setup();

      await page.goto(getInviteLinkPagePath(data.link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
    });
  });

  test.describe('given: a logged in user', () => {
    async function setup({
      page,
      deactivatedAt,
    }: {
      page: Page;
      deactivatedAt?: OrganizationInviteLink['deactivatedAt'];
    }) {
      const { auth, data } = await promiseHash({
        auth: setupOrganizationAndLoginAsMember({ page }),
        data: createUserWithOrgAndAddAsMember(),
      });
      const link = createPopulatedOrganizationInviteLink({
        deactivatedAt,
        creatorId: data.user.id,
        organizationId: data.organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return {
        link,
        // auth's user & organization are for the authenticated user.
        auth,
        // data's user & organization are for the existing organization
        // for which the authenticated user received an invite link.
        data,
      };
    }

    test('given: an invalid token, should: show a 404 page', async ({
      page,
    }) => {
      const { auth, data } = await setup({
        page,
      });

      await page.goto(getInviteLinkPagePath('invalid-token'));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test('given: a valid token, should: let the user join the organization', async ({
      page,
    }) => {
      const { link, auth, data } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      // It renders the correct page & heading.
      await expect(page.getByText(/welcome to /i)).toBeVisible();
      await expect(
        page.getByRole('heading', {
          name: new RegExp(
            `${data.user.name} invites you to join ${data.organization.name}`,
            'i',
          ),
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(/click the button below to sign up/i),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /accept invite/i }),
      ).toBeVisible();

      // It has a button to accept the invite, shows a success toast and
      // redirects to the organization's dashboard.
      await page.getByRole('button', { name: /accept invite/i }).click();
      await expect(
        page.getByRole('button', { name: /accepting invite/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('region', {
            name: /notifications/i,
          })
          .getByText(/successfully joined organization/i),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${data.organization.slug}/dashboard`,
      );

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test('given: a valid token for a deactivated invite link, should: show a 404 page ', async ({
      page,
    }) => {
      const { link, auth, data } = await setup({
        page,
        deactivatedAt: new Date(),
      });

      await page.goto(getInviteLinkPagePath(link.token));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);
      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test('given: a valid token for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening', async ({
      page,
    }) => {
      // Create an organization with the low tier plan (1 seat limit)
      const { auth, data } = await promiseHash({
        auth: setupOrganizationAndLoginAsMember({ page }),
        data: createUserWithOrgAndAddAsMember({
          lookupKey: priceLookupKeysByTierAndInterval.low.annual,
        }),
      });

      // Create an invite link for this organization
      const link = createPopulatedOrganizationInviteLink({
        creatorId: data.user.id,
        organizationId: data.organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      // Visit the invite link page
      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button
      await page.getByRole('button', { name: /accept invite/i }).click();

      // Verify toast message
      await expect(
        page
          .getByRole('region', { name: /notifications/i })
          .getByText(/organization has reached its member limit/i),
      ).toBeVisible();

      // Verify we're still on the same page (not redirected)
      expect(getPath(page)).toEqual(getInviteLinkPagePath(link.token));

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test("given: a valid token for an organization that the user is already a member of, should: redirect to the organization and show a toast that they're already a member", async ({
      page,
    }) => {
      // Create an organization and make the user a member and log in as that
      // user
      const { user, organization } = await setupOrganizationAndLoginAsMember({
        page,
        lookupKey: priceLookupKeysByTierAndInterval.mid.annual,
      });

      // Create an invite link for the same organization
      const link = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      // Visit the invite link page
      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button
      await page.getByRole('button', { name: /accept invite/i }).click();

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

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given a valid token, should: lack any automatically detectable accessibility issues', async ({
      page,
    }) => {
      const { link, auth, data } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });
  });
});
