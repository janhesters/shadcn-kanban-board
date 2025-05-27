import AxeBuilder from '@axe-core/playwright';
import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';

import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import {
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
  updateOrganizationMembershipInDatabase,
} from '~/features/organizations/organization-membership-model.server';
import { retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId } from '~/features/organizations/organizations-email-invite-link-model.server';
import {
  createPopulatedOrganization,
  createPopulatedOrganizationInviteLink,
} from '~/features/organizations/organizations-factories.server';
import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  saveOrganizationInviteLinkToDatabase,
} from '~/features/organizations/organizations-invite-link-model.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';
import { asyncForEach } from '~/utils/async-for-each.server';

import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

/** Helper to create multiple members with specific roles */
async function setupMultipleMembers({
  page,
  requestingUserRole,
  otherMemberRoles = [], // Array of roles for other members
  activeInviteLink = false, // Whether to create an active invite link initially
}: {
  page: Page;
  requestingUserRole: OrganizationMembershipRole;
  otherMemberRoles?: OrganizationMembershipRole[];
  activeInviteLink?: boolean;
}) {
  // Create the main user and log them in with the specified role
  const { organization, user: requestingUser } =
    await setupOrganizationAndLoginAsMember({
      page,
      role: requestingUserRole,
      lookupKey: priceLookupKeysByTierAndInterval.high.annual,
    });

  // Create other users and add them to the organization with specified roles
  const otherUsers = await Promise.all(
    otherMemberRoles.map(async (role, index) => {
      const otherUser = createPopulatedUserAccount({
        // Ensure unique emails if needed
        email: `test-member-${role}-${index}-${faker.string.uuid()}@example.com`,
        name: faker.person.fullName(), // Give them names for easier identification
      });
      await saveUserAccountToDatabase(otherUser);
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [otherUser.id],
        role: role,
      });
      return otherUser;
    }),
  );

  // Optionally create an active invite link
  let inviteLink;
  if (activeInviteLink) {
    inviteLink = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: requestingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(inviteLink);
  }

  // Combine all users for teardown
  const allUsers = [requestingUser, ...otherUsers];

  return { organization, requestingUser, otherUsers, allUsers, inviteLink };
}

/** Teardown helper for multiple members */
async function teardownMultipleMembers({
  organization,
  allUsers,
}: {
  organization: Organization;
  allUsers: UserAccount[];
}) {
  // Delete the organization (cascades memberships and invite links)
  await deleteOrganizationFromDatabaseById(organization.id);
  // Delete all created users
  await asyncForEach(allUsers, async user => {
    await deleteUserAccountFromDatabaseById(user.id);
  });
}

const getMembersPagePath = (slug: string) =>
  `/organizations/${slug}/settings/members`;

test.describe('organization settings members page', () => {
  // ========================================================================
  // Authentication & Authorization Tests
  // ========================================================================
  test('given: a logged out user, should: redirect to login page', async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    const path = getMembersPagePath(slug);
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in user who is NOT onboarded, should: redirect to onboarding', async ({
    page,
  }) => {
    // Setup user without name (implies not onboarded)
    const user = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });
    // Create an org manually they _could_ belong to, but they aren't onboarded
    const organization = createPopulatedOrganization();
    await saveOrganizationToDatabase(organization);

    const path = getMembersPagePath(organization.slug);
    await page.goto(path);

    // Expect redirect to user profile onboarding step (or org step depending on flow)
    expect(getPath(page)).toMatch(/\/onboarding\//);

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a user who is NOT a member of the organization, should: show 404 page', async ({
    page,
  }) => {
    // User 1 and their org
    const { organization: org1, user: user1 } =
      await setupOrganizationAndLoginAsMember({ page });
    // User 2 and their org
    const org2 = createPopulatedOrganization();
    await saveOrganizationToDatabase(org2);

    // User 1 tries to access User 2's org settings
    await page.goto(getMembersPagePath(org2.slug));

    // Assert 404 content
    await expect(
      page.getByRole('heading', { name: /page not found/i, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/404/i);

    // Cleanup
    await teardownOrganizationAndMember({ organization: org1, user: user1 });
    await deleteOrganizationFromDatabaseById(org2.id);
  });

  test('given: a member who has been deactivated, should: redirect to organization onboarding', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member, // Start as active member
    });

    // Deactivate the user in the DB
    await updateOrganizationMembershipInDatabase({
      userId: user.id,
      organizationId: organization.id,
      data: { deactivatedAt: new Date() },
    });

    // Attempt to access the members page
    await page.goto(getMembersPagePath(organization.slug));

    // Assert redirection (likely to a page asking to join/create org)
    expect(getPath(page)).toEqual('/onboarding/organization');

    await teardownOrganizationAndMember({ organization, user });
  });

  // ========================================================================
  // Role: Member - UI & Functionality Tests
  // ========================================================================
  test.describe('as Member', () => {
    test('given: a member visits the organization team member settings page,should: show member list, hide invite cards, and disable role changes', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.member,
        otherMemberRoles: [OrganizationMembershipRole.owner], // Include an owner to see their role
      });
      const { organization, requestingUser, otherUsers } = data;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for members
      await expect(
        page.getByText(/view who is a member of your organization/i),
      ).toBeVisible();

      // Verify Invite Cards are Hidden
      await expect(page.getByText(/invite by email/i)).toBeHidden();
      await expect(page.getByText(/invite link/i)).toBeHidden();
      await expect(
        page.getByRole('button', { name: /send email invite/i }),
      ).toBeHidden();
      await expect(
        page.getByRole('button', { name: /create new invite link/i }),
      ).toBeHidden();

      // Verify Member Table
      const table = page.getByRole('table');
      await expect(table).toBeVisible();

      // Check requesting user's row (cannot change own role)
      const userRow = table.getByRole('row', { name: requestingUser.email });
      // Check that there are two cells with the name of the user (avatar &
      // actual name)
      await expect(
        userRow.getByRole('cell', { name: requestingUser.name }),
      ).toBeVisible();
      await expect(
        userRow.getByRole('cell', { name: requestingUser.email }),
      ).toBeVisible();
      await expect(
        userRow.getByRole('cell', { name: /member/i }),
      ).toBeVisible(); // Shows text, not button
      await expect(
        userRow.getByRole('button', { name: /member/i }),
      ).toBeHidden(); // No button to change role

      // Check other user's row (member cannot change others' roles)
      const otherUser = otherUsers[0];
      const otherRow = table.getByRole('row', { name: otherUser.email });
      // Check that there are two cells with the name of the user (avatar &
      // actual name)
      await expect(
        otherRow.getByRole('cell', { name: otherUser.name }),
      ).toBeVisible();
      await expect(
        otherRow.getByRole('cell', { name: otherUser.email }),
      ).toBeVisible();
      await expect(
        otherRow.getByRole('cell', { name: /^owner$/i }),
      ).toBeVisible(); // Shows text, not button
      await expect(
        otherRow.getByRole('button', { name: /^owner$/i }),
      ).toBeHidden(); // No button to change role

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Role: Admin - UI & Functionality Tests
  // ========================================================================
  test.describe('as Admin', () => {
    test('given: an admin visits the organization team member settings page, should: show member list, show invite cards, allow changing Member/Admin roles (not Owner)', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.owner,
        ],
      });
      const { organization, requestingUser, otherUsers } = data;
      const memberUser = otherUsers.find(u =>
        u.email.includes('test-member-member'),
      )!;
      const ownerUser = otherUsers.find(u =>
        u.email.includes('test-member-owner'),
      )!;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for admins
      await expect(
        page.getByText(/manage your team members and their permissions./i),
      ).toBeVisible();

      // Verify Invite Cards are Visible
      await test.step('verify invite cards are visible', async () => {
        await expect(page.getByText(/invite by email/i)).toBeVisible();
        await expect(page.getByText(/share an invite link/i)).toBeVisible();
        // Role dropdown in invite card should NOT have Owner option
        await page
          .getByRole('combobox', { name: /role/i })
          .first() // Assuming first role dropdown is email invite
          .click();
        await expect(page.getByRole('option', { name: /owner/i })).toBeHidden();
        await page.keyboard.press('Escape');
      });

      // Verify Member Table & Role Changes
      const table = page.getByRole('table');

      // Check Admin's own row (cannot change self)
      await test.step('check admin row is visible and cannot change role', async () => {
        const adminRow = table.getByRole('row', { name: requestingUser.email });
        await expect(
          adminRow.getByRole('cell', { name: /admin/i }),
        ).toBeVisible();
        await expect(
          adminRow.getByRole('button', { name: /admin/i }),
        ).toBeHidden();

        // Check Member's row (Admin CAN change Member)
        const memberRow = table.getByRole('row', { name: memberUser.email });
        const memberRoleButton = memberRow.getByRole('button', {
          name: /member/i,
        });
        await expect(memberRoleButton).toBeVisible();
        // Try changing Member to Admin
        await memberRoleButton.focus();
        await page.keyboard.press('Enter');
        await expect(
          page.getByRole('combobox', { name: /select new role/i }),
        ).toBeVisible();
        const changeToAdminButton = page.getByRole('button', {
          name: /admin/i,
        }); // Use exact match to distinguish from description
        await expect(changeToAdminButton).toBeVisible();
        await expect(
          page.getByRole('button', { name: /^owner$/i }),
        ).toBeHidden(); // Admin cannot promote to Owner
        // Click change to Admin
        await changeToAdminButton.click();

        // UI should ideally update after fetcher returns, check for the "Admin" button now
        await page.keyboard.press('Escape'); // Close the dropdown
        await expect(
          page.getByRole('combobox', { name: /select new role/i }),
        ).toBeHidden();
        await expect(
          page
            .getByRole('table')
            .getByRole('row', { name: memberUser.email })
            .getByRole('button', { name: /admin/i }),
        ).toBeVisible();

        // Check DB
        const updatedMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { userId: memberUser.id, organizationId: organization.id },
          );
        expect(updatedMembership?.role).toEqual(
          OrganizationMembershipRole.admin,
        );
      });

      // Check Owner's row (Admin CANNOT change Owner)
      const ownerRow = table.getByRole('row', { name: ownerUser.email });
      await expect(
        ownerRow.getByRole('cell', { name: /^owner$/i }),
      ).toBeVisible(); // Just text
      await expect(
        ownerRow.getByRole('button', { name: /^owner$/i }),
      ).toBeHidden(); // No button

      await teardownMultipleMembers(data);
    });

    test('given: an admin visits the organization team member settings page, should: allow deactivating Members/Admins (not Owners)', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.owner,
        ],
      });
      const { organization, otherUsers } = data;
      const memberUser = otherUsers.find(u =>
        u.email.includes('test-member-member'),
      )!;
      const ownerUser = otherUsers.find(u =>
        u.email.includes('test-member-owner'),
      )!;

      await page.goto(getMembersPagePath(organization.slug));
      const table = page.getByRole('table');

      // Deactivate Member
      const memberRow = table.getByRole('row', { name: memberUser.email });
      await memberRow.getByRole('button', { name: /member/i }).click();
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeVisible();
      await page.getByRole('button', { name: /deactivated/i }).click();
      await page.keyboard.press('Escape'); // Close the dropdown
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeHidden();
      await expect(
        memberRow.getByRole('button', { name: /^deactivated$/i }),
      ).toBeVisible();

      // Check DB
      const updatedMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { userId: memberUser.id, organizationId: organization.id },
        );
      expect(updatedMembership?.deactivatedAt).not.toBeNull();
      expect(updatedMembership?.role).toEqual(
        OrganizationMembershipRole.member,
      ); // Role remains

      // Check UI (shows deactivated text)
      await expect(
        memberRow.getByRole('cell', { name: /deactivated/i }),
      ).toBeVisible();
      await expect(
        memberRow.getByRole('button', { name: /member/i }),
      ).toBeHidden(); // Button gone

      // Cannot Deactivate Owner
      const ownerRow = table.getByRole('row', { name: ownerUser.email });
      await expect(
        ownerRow.getByRole('button', { name: /owner/i }),
      ).toBeHidden(); // No button to open popover

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Role: Owner - UI & Functionality Tests
  // ========================================================================
  test.describe('as Owner', () => {
    test('given: an owner visits the organization team member settings page, should: show member list, invite cards, and allow changing ALL roles (except self)', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.admin,
        ],
      });
      const { organization, requestingUser, otherUsers } = data;
      const memberUser = otherUsers.find(u =>
        u.email.includes('test-member-member'),
      )!;
      const adminUser = otherUsers.find(u =>
        u.email.includes('test-member-admin'),
      )!;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for admins
      await expect(
        page.getByText(/manage your team members and their permissions./i),
      ).toBeVisible();

      // Verify Invite Cards are Visible & Owner option available
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();
      await page.getByRole('combobox', { name: /role/i }).first().click();
      await expect(page.getByRole('option', { name: /owner/i })).toBeVisible();
      await page.keyboard.press('Escape');

      // Verify Member Table & Role Changes
      await expect(page.getByRole('table')).toBeVisible();

      // Check Owner's own row (cannot change self)
      const ownerRow = page
        .getByRole('table')
        .getByRole('row', { name: requestingUser.email });
      await expect(
        ownerRow.getByRole('cell', { name: /owner/i }),
      ).toBeVisible();
      await expect(
        ownerRow.getByRole('button', { name: /owner/i }),
      ).toBeHidden();

      // Check Member's row (Owner CAN change Member to Owner)
      const memberRow = page
        .getByRole('table')
        .getByRole('row', { name: memberUser.email });
      await memberRow.getByRole('button', { name: /member/i }).click();
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeVisible();
      await page.getByRole('button', { name: /owner/i }).click();
      await page.keyboard.press('Escape'); // Close the dropdown
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeHidden();
      await expect(
        page
          .getByRole('table')
          .getByRole('row', {
            name: memberUser.email,
          })
          .getByRole('button', { name: /^owner$/i }),
      ).toBeVisible(); // Button text updated

      // Check Admin's row (Owner CAN change Admin to Member)
      await page
        .getByRole('table')
        .getByRole('row', { name: adminUser.email })
        .getByRole('button', { name: /admin/i })
        .click();
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /member/i })
        .first()
        .click();
      await page.keyboard.press('Escape'); // Close the dropdown
      await expect(
        page.getByRole('combobox', { name: /select new role/i }),
      ).toBeHidden();
      await expect(
        page
          .getByRole('table')
          .getByRole('row', { name: adminUser.email })
          .getByRole('button', { name: /^member$/i }),
      ).toBeVisible();

      // Check DB for member
      const updatedMemberMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { userId: memberUser.id, organizationId: organization.id },
        );
      expect(updatedMemberMembership?.role).toEqual(
        OrganizationMembershipRole.owner,
      );

      // Check DB for admin
      const updatedAdminMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { userId: adminUser.id, organizationId: organization.id },
        );
      expect(updatedAdminMembership?.role).toEqual(
        OrganizationMembershipRole.member,
      );

      await teardownMultipleMembers(data);
    });

    test('given: an owner visits the organization team member settings page, should: allow deactivating any other member (Member, Admin, Owner)', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.admin,
          OrganizationMembershipRole.owner, // Add another owner
        ],
      });
      const { organization, otherUsers } = data;

      await page.goto(getMembersPagePath(organization.slug));

      // Deactivate each type of user
      for (const userToDeactivate of otherUsers) {
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { userId: userToDeactivate.id, organizationId: organization.id },
          );
        const initialRole = membership?.role;

        // Close any open dropdown
        await page.keyboard.press('Escape');
        const table = page.getByRole('table');
        await expect(table).toBeVisible();
        await expect(
          table.getByRole('row', {
            name: userToDeactivate.email,
          }),
        ).toBeVisible();
        await table
          .getByRole('row', {
            name: userToDeactivate.email,
          })
          .getByRole('button', { name: new RegExp(initialRole ?? '', 'i') })
          .click();
        await expect(
          page.getByRole('combobox', { name: /select new role/i }),
        ).toBeVisible();
        await page
          .getByRole('button', { name: /deactivated/i })
          .last()
          .click();

        // Close the dropdown
        await page.keyboard.press('Escape');
        await expect(
          page.getByRole('combobox', { name: /select new role/i }),
        ).toBeHidden();

        // Check UI
        await expect(
          page
            .getByRole('table')
            .getByRole('row', {
              name: userToDeactivate.email,
            })
            .getByRole('cell', { name: /^deactivated$/i }),
        ).toBeVisible();

        // Check DB
        const updatedMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { userId: userToDeactivate.id, organizationId: organization.id },
          );
        expect(updatedMembership?.deactivatedAt).not.toBeNull();
        expect(updatedMembership?.role).toEqual(initialRole); // Role preserved
      }

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Invite Link Card Tests (Owner/Admin)
  // ========================================================================
  test.describe('Invite Link Card (as Owner)', () => {
    test('given: an owner visits the organization team member settings page, should: show create button initially, then link UI after creation', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        activeInviteLink: false, // Start with no link
      });
      const { organization } = data;

      await page.goto(getMembersPagePath(organization.slug));

      const createButton = page.getByRole('button', {
        name: /create new invite link/i,
      });
      const linkDisplay = page.getByRole('link', {
        name: /go to the invite link's page/i,
      });
      const regenerateButton = page.getByRole('button', {
        name: /regenerate link/i,
      });
      const deactivateButton = page.getByRole('button', {
        name: /deactivate link/i,
      });

      // Initial state: Create button visible, others hidden
      await expect(createButton).toBeVisible();
      await expect(linkDisplay).toBeHidden();
      await expect(regenerateButton).toBeHidden();
      await expect(deactivateButton).toBeHidden();

      // Click Create
      await createButton.click();

      // After creation: Link UI visible, create button hidden
      await expect(createButton).toBeHidden();
      await expect(linkDisplay).toBeVisible();
      await expect(regenerateButton).toBeVisible();
      await expect(deactivateButton).toBeVisible();

      // Check link href structure
      const href = await linkDisplay.getAttribute('href');
      expect(href).toContain('/organizations/invite-link?token=');

      await teardownMultipleMembers(data);
    });

    test('given: an owner visits the organization team member settings page, should: allow regenerating and deactivating the link', async ({
      page,
      browserName,
    }) => {
      // Grant clipboard permissions for copy test
      if (browserName === 'chromium') {
        await page.context().grantPermissions(['clipboard-read']);
      }

      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        activeInviteLink: true, // Start with a link
      });
      const { organization } = data;

      await page.goto(getMembersPagePath(organization.slug));

      const createButton = page.getByRole('button', {
        name: /create new invite link/i,
      });
      const linkDisplay = page.getByRole('link', {
        name: /go to the invite link's page/i,
      });
      const copyButton = page.getByRole('button', {
        name: /copy invite link/i,
      });
      const regenerateButton = page.getByRole('button', {
        name: /regenerate link/i,
      });
      const deactivateButton = page.getByRole('button', {
        name: /deactivate link/i,
      });

      // Initial state (link exists)
      await expect(createButton).toBeHidden();
      await expect(linkDisplay).toBeVisible();
      await expect(copyButton).toBeVisible();
      await expect(regenerateButton).toBeVisible();
      await expect(deactivateButton).toBeVisible();

      // Test Copy
      await copyButton.click();
      await expect(
        page.getByRole('button', { name: /invite link copied/i }),
      ).toBeVisible();

      if (browserName === 'chromium') {
        const clipboardText = await page.evaluate(
          'navigator.clipboard.readText()',
        );
        expect(clipboardText).toEqual(
          expect.stringContaining('/organizations/invite-link?token='),
        );
      }

      // Test Regenerate
      // It lets the user generate a new link.
      const oldLink = await page
        .getByRole('link', { name: /go to the invite link's page/i })
        .getAttribute('href');
      await page.getByRole('button', { name: /regenerate link/i }).click();
      expect(
        page
          .getByRole('link', { name: /go to the invite link's page/i })
          .getAttribute('href'),
      ).not.toEqual(oldLink);
      // Test Deactivate
      await deactivateButton.click();

      // After deactivation: Create button visible, others hidden
      await expect(createButton).toBeVisible();
      await expect(linkDisplay).toBeHidden();
      await expect(regenerateButton).toBeHidden();
      await expect(deactivateButton).toBeHidden();

      // Verify in DB
      const latestLink =
        await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(latestLink).toBeNull(); // No active link

      await teardownMultipleMembers(data);
    });
  });

  test.describe('Send Email To Invite Users', () => {
    test('given: an admin, should: allow the admin to invite users as members or admins', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
      });
      const { organization } = data;
      const inviteEmail = faker.internet.email();

      await page.goto(getMembersPagePath(organization.slug));

      // Locate elements within the "Invite by Email" card
      const emailInput = page.getByLabel(/email/i);
      const roleDropdown = page.getByLabel(/role/i);
      const submitButton = page.getByRole('button', {
        name: /send email invitation/i,
      });

      // Check available roles in dropdown
      await roleDropdown.click();
      await expect(page.getByRole('option', { name: /member/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /admin/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /owner/i })).toBeHidden();

      // Select the highest available role (Admin)
      await page.getByRole('option', { name: /admin/i }).click();

      // Enter email and submit
      await emailInput.fill(inviteEmail);
      await submitButton.click();

      // Check for success toast
      await expect(
        page
          .getByRole('region', {
            name: /notifications/i,
          })
          .getByText(/email invitation sent/i),
      ).toBeVisible();

      // Check that the pending invite is displayed in the members table
      const pendingInviteRow = page
        .getByRole('table')
        .getByRole('row', { name: inviteEmail });
      await expect(pendingInviteRow).toBeVisible();
      await expect(pendingInviteRow.getByText(/pending/i)).toBeVisible();
      await expect(pendingInviteRow.getByText(/admin/i)).toBeVisible();

      // Check database for the invite
      const emailInvites =
        await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(emailInvites).toHaveLength(1);
      expect(emailInvites[0].email).toEqual(inviteEmail);
      expect(emailInvites[0].role).toEqual(OrganizationMembershipRole.admin);

      // Check that the email input is automatically cleared after successful
      // submission
      await expect(emailInput).toHaveValue('');

      await teardownMultipleMembers(data);
    });

    test('given: an owner, should: allow the owner to invite users as members, admins, or owners', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization } = data;
      const inviteEmail = faker.internet.email();

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that you're on the correct page
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();

      // Locate elements within the "Invite by Email" card
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      const roleDropdown = page.getByLabel(/role/i);
      await expect(roleDropdown).toBeVisible();
      const submitButton = page.getByRole('button', {
        name: /send email invitation/i,
      });
      await expect(submitButton).toBeVisible();

      // Check available roles in dropdown
      await roleDropdown.click();
      await expect(page.getByRole('option', { name: /member/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /admin/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /owner/i })).toBeVisible();

      // Select the highest available role (Owner)
      await page.getByRole('option', { name: /owner/i }).click();

      // Enter email and submit
      await emailInput.fill(inviteEmail);
      await submitButton.click();

      // Check for success toast
      await expect(
        page
          .getByRole('region', {
            name: /notifications/i,
          })
          .getByText(/email invitation sent/i),
      ).toBeVisible();

      // Check that the pending invite is displayed in the members table
      const pendingInviteRow = page
        .getByRole('table')
        .getByRole('row', { name: inviteEmail });
      await expect(pendingInviteRow).toBeVisible();
      await expect(pendingInviteRow.getByText(/pending/i)).toBeVisible();
      await expect(pendingInviteRow.getByText(/owner/i)).toBeVisible();

      // Check database for the invite
      const emailInvites =
        await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(emailInvites).toHaveLength(1);
      expect(emailInvites[0].email).toEqual(inviteEmail);
      expect(emailInvites[0].role).toEqual(OrganizationMembershipRole.owner);

      // Check that the email input is automatically cleared after successful
      // submission
      await expect(emailInput).toHaveValue('');

      await teardownMultipleMembers(data);
    });

    test('given: sending an email to a user who is already a member, should: show an error message', async ({
      page,
    }) => {
      // Setup: Owner and another Member
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        otherMemberRoles: [OrganizationMembershipRole.member], // Need at least one other member
      });
      const { organization, otherUsers } = data;
      const existingMember = otherUsers[0]; // Get the member we just created

      // Navigate to the team members page
      await page.goto(getMembersPagePath(organization.slug));

      // Verify that you're on the correct page
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();

      // Locate the email invite form elements
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      const submitButton = page.getByRole('button', {
        name: /send email invitation/i,
      });
      await expect(submitButton).toBeVisible();

      // Attempt to invite the existing member
      await emailInput.fill(existingMember.email);
      await submitButton.click();

      // Assert that the error message is shown
      // Using regex based on the translation string: "{{email}} is already a member"
      const expectedErrorMessage = new RegExp(
        `${existingMember.email} is already a member`,
        'i',
      );
      await expect(page.getByText(expectedErrorMessage)).toBeVisible();

      // Teardown
      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Pagination Tests
  // ========================================================================
  test.describe('Pagination', () => {
    test('given: members are <= page size (10), should: disable pagination buttons', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        otherMemberRoles: Array.from(
          { length: 8 }, // 1 owner + 8 others = 9 total
          () => OrganizationMembershipRole.member,
        ),
      });

      await page.goto(getMembersPagePath(data.organization.slug));

      await expect(
        page.getByRole('button', { name: /go to first/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: /go to previous/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: /go to next/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: /go to last/i }),
      ).toBeDisabled();

      await teardownMultipleMembers(data);
    });

    test('given: members > page size (10), should: enable pagination buttons', async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
        otherMemberRoles: Array.from(
          { length: 15 }, // 1 owner + 15 others = 16 total
          (_, index) =>
            index % 3 === 0
              ? OrganizationMembershipRole.admin
              : OrganizationMembershipRole.member, // Mix roles
        ),
      });
      const { organization } = data;

      await page.goto(getMembersPagePath(organization.slug));

      const tableBody = page.getByRole('table').locator('tbody');
      const firstPageButton = page.getByRole('button', {
        name: /go to first/i,
      });
      const previousPageButton = page.getByRole('button', {
        name: /go to previous/i,
      });
      const nextPageButton = page.getByRole('button', {
        name: /go to next/i,
      });
      const lastPageButton = page.getByRole('button', {
        name: /go to last/i,
      });
      const pageInfo = page.getByText(/page \d+ of \d+/i);
      const rowsPerPageSelect = page.getByRole('combobox', {
        name: /rows per page/i,
      });

      // Initial state (Page 1 of 2, 10 rows)
      await expect(tableBody.getByRole('row')).toHaveCount(10);
      await expect(pageInfo).toHaveText('Page 1 of 2');
      await expect(firstPageButton).toBeDisabled();
      await expect(previousPageButton).toBeDisabled();
      await expect(nextPageButton).toBeEnabled();
      await expect(lastPageButton).toBeEnabled();

      // Go to next page
      await nextPageButton.click();
      await expect(tableBody.getByRole('row')).toHaveCount(6); // Remaining rows
      await expect(pageInfo).toHaveText('Page 2 of 2');
      await expect(firstPageButton).toBeEnabled();
      await expect(previousPageButton).toBeEnabled();
      await expect(nextPageButton).toBeDisabled();
      await expect(lastPageButton).toBeDisabled();

      // Go back to previous page
      await previousPageButton.click();
      await expect(tableBody.getByRole('row')).toHaveCount(10);
      await expect(pageInfo).toHaveText('Page 1 of 2');
      await expect(firstPageButton).toBeDisabled(); // Back to page 1

      // Change rows per page to 20
      await rowsPerPageSelect.click(); // Open the dropdown
      await page.getByRole('option', { name: '20' }).click(); // Select "20" from dropdown
      await expect(rowsPerPageSelect).toHaveText('20'); // Verify selection
      await expect(tableBody.getByRole('row')).toHaveCount(16); // All rows visible
      await expect(pageInfo).toHaveText('Page 1 of 1');
      await expect(nextPageButton).toBeDisabled(); // Now only one page

      await teardownMultipleMembers(data);
    });
  });

  test('given: an owner for an organization who has reached the maximum number of seats: should show a warning and deactivate the buttons', async ({
    page,
  }) => {
    const data = await setupOrganizationAndLoginAsMember({
      organization: createPopulatedOrganization(),
      page,
      role: OrganizationMembershipRole.owner,
      lookupKey: priceLookupKeysByTierAndInterval.low.annual,
    });

    await page.goto(getMembersPagePath(data.organization.slug));

    // 1. Alert/banner is visible with appropriate text
    const alertBanner = page.getByRole('alert');
    await expect(alertBanner.getByText(/no seats remaining/i)).toBeVisible();
    await expect(
      alertBanner.getByText(
        /switch to a higher-tier plan or contact sales to invite new members./i,
      ),
    ).toBeVisible();
    await expect(
      alertBanner.getByRole('link', { name: /go to billing/i }),
    ).toHaveAttribute(
      'href',
      `/organizations/${data.organization.slug}/settings/billing`,
    );

    // 2. Invite-by-link button is disabled
    const createLinkButton = page.getByRole('button', {
      name: /create new invite link/i,
    });
    await expect(createLinkButton).toBeDisabled();

    // 3. Send-email-invitation button is disabled
    const sendEmailButton = page.getByRole('button', {
      name: /send email invitation/i,
    });
    await expect(sendEmailButton).toBeDisabled();

    // teardown
    await teardownOrganizationAndMember(data);
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================
  test('given: an owner user, should: lack automatically detectable accessibility issues', async ({
    page,
  }) => {
    const data = await setupMultipleMembers({
      page,
      requestingUserRole: OrganizationMembershipRole.owner,
      otherMemberRoles: [OrganizationMembershipRole.member],
      activeInviteLink: true,
    });

    await page.goto(getMembersPagePath(data.organization.slug));

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownMultipleMembers(data);
  });
});
