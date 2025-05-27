import { faker } from '@faker-js/faker';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { Member } from './team-members-table';
import { TeamMembersTable } from './team-members-table';

const createMember: Factory<Member> = ({
  email = createPopulatedUserAccount().email,
  id = createPopulatedUserAccount().id,
  name = createPopulatedUserAccount().name,
  role = faker.helpers.arrayElement(Object.values(OrganizationMembershipRole)),
  deactivatedAt = faker.datatype.boolean() ? faker.date.recent() : null,
  status = faker.helpers.arrayElement([
    'joinedViaLink',
    'joinedViaEmailInvite',
  ]),
  avatar = createPopulatedUserAccount().imageUrl,
  isCurrentUser,
} = {}) => ({
  avatar,
  deactivatedAt,
  email,
  id,
  isCurrentUser,
  name,
  role,
  status,
});

const createMembers = (count: number): Member[] => {
  return Array.from({ length: count }, () => createMember());
};

const createProps: Factory<{
  currentUsersRole: OrganizationMembershipRole;
  members: Member[];
}> = ({
  currentUsersRole = faker.helpers.arrayElement(
    Object.values(OrganizationMembershipRole),
  ),
  members = createMembers(faker.number.int({ min: 1, max: 10 })),
} = {}) => ({ currentUsersRole, members });

describe('TeamMembersTable Component', () => {
  test('given: an array of team members, should: render the table with all columns', () => {
    const props = createProps({
      members: [
        createMember({ role: 'member', deactivatedAt: null }),
        createMember({ role: 'admin', deactivatedAt: null }),
        createMember({ role: 'owner', deactivatedAt: null }),
      ],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify table headers
    expect(
      screen.getByRole('columnheader', { name: /name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /role/i }),
    ).toBeInTheDocument();

    // Verify member data
    for (const member of props.members) {
      expect(
        screen.getByText(new RegExp(member.name, 'i')),
      ).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(member.email, 'i')),
      ).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(member.role, 'i')),
      ).toBeInTheDocument();
    }
  });

  test('given: no team members, should: display "no members found" message', () => {
    const props = createProps({ members: [] });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/no members found/i)).toBeInTheDocument();
  });

  test('given: a member, should: display initials as fallback in avatar', () => {
    const props = createProps({
      members: [createMember({ name: 'John Doe' })],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    for (const member of props.members) {
      const initials = member.name.slice(0, 2).toUpperCase();
      expect(screen.getByText(initials)).toBeInTheDocument();
    }
  });

  test('given: a member with status "joinedViaLink", should: display green checkmark with correct text', () => {
    const member = createMember({ status: 'joinedViaLink' });
    const props = createProps({ members: [member] });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    const statusBadge = screen.getByText(/joined/i);
    expect(statusBadge).toBeInTheDocument();
  });

  test('given: a member with status "emailInvitePending", should: display loading icon with correct text', () => {
    const member = createMember({ status: 'emailInvitePending' });
    const props = createProps({ members: [member] });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    const statusBadge = screen.getByText(/pending/i);
    expect(statusBadge).toBeInTheDocument();
  });

  test('given: current user is a member, should: display roles as text only', () => {
    const props = createProps({
      currentUsersRole: OrganizationMembershipRole.member,
      members: [createMember({ role: 'owner', deactivatedAt: null })],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify no role switcher buttons are present
    expect(
      screen.queryByRole('button', { name: /role/i }),
    ).not.toBeInTheDocument();

    // Verify role is displayed as text
    expect(screen.getByText(/owner/i)).toBeInTheDocument();
  });

  test('given: current user is an owner, should: display role switcher with all roles for other members', () => {
    const props = createProps({
      currentUsersRole: OrganizationMembershipRole.owner,
      members: [
        createMember({ role: 'member', deactivatedAt: null }),
        createMember({ role: 'admin', deactivatedAt: null }),
        createMember({ role: 'owner', deactivatedAt: null }),
      ],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify role switcher buttons are present with correct role texts
    expect(screen.getByRole('button', { name: /member/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /owner/i })).toBeInTheDocument();
  });

  test('given: current user is an admin, should: display role switcher for admins and members', () => {
    const props = createProps({
      currentUsersRole: OrganizationMembershipRole.admin,
      members: [
        createMember({ role: 'member', deactivatedAt: null }),
        createMember({ role: 'admin', deactivatedAt: null }),
        createMember({ role: 'owner', deactivatedAt: null }),
      ],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify role switcher buttons are present with correct role texts
    expect(screen.getByRole('button', { name: /member/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument();
    // Admins shouldn't be able to switch roles of owners.
    expect(
      screen.queryByRole('button', { name: /owner/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/owner/i)).toBeInTheDocument();
  });

  test('given: current user is an owner or admin and viewing their own row, should: display role as text only', () => {
    const currentUser = createMember({
      role: faker.helpers.arrayElement([
        OrganizationMembershipRole.admin,
        OrganizationMembershipRole.owner,
      ]),
      deactivatedAt: null,
      isCurrentUser: true,
    });
    const props = createProps({
      currentUsersRole: currentUser.role,
      members: [currentUser],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify no role switcher button for current user
    expect(
      screen.queryByRole('button', { name: new RegExp(currentUser.role, 'i') }),
    ).not.toBeInTheDocument();
    // Verify role is displayed as text
    expect(
      screen.getByText(new RegExp(currentUser.role, 'i')),
    ).toBeInTheDocument();
  });

  test('given: multiple pages of results, should: display pagination controls', () => {
    const props = createProps({
      members: createMembers(25), // More than default page size
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify pagination controls
    expect(
      screen.getByRole('button', { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /rows per page/i }),
    ).toBeInTheDocument();
  });

  test('given: a pending invited member, should: display role as text only without role switcher', () => {
    const props = createProps({
      currentUsersRole: OrganizationMembershipRole.owner,
      members: [
        createMember({
          role: 'member',
          status: 'emailInvitePending',
          deactivatedAt: null,
        }),
      ],
    });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <TeamMembersTable {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify no role switcher button is present for pending invite
    expect(
      screen.queryByRole('button', { name: /member/i }),
    ).not.toBeInTheDocument();

    // Verify role is displayed as text
    expect(screen.getByText(/member/i)).toBeInTheDocument();

    // Verify status shows pending with loading indicator
    const pendingBadge = screen.getByText(/pending/i);
    expect(pendingBadge).toBeInTheDocument();
  });
});
