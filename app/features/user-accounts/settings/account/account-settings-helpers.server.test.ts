import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';

import { mapUserAccountWithMembershipsToDangerZoneProps } from './account-settings-helpers.server';

describe('mapUserAccountWithMembershipsToDangerZoneProps()', () => {
  test('given: a user account with no memberships, should: return danger zone props with empty arrays', () => {
    const user = createPopulatedUserAccount();

    const actual = mapUserAccountWithMembershipsToDangerZoneProps({
      ...user,
      memberships: [],
    });
    const expected = {
      imlicitlyDeletedOrganizations: [],
      organizationsBlockingAccountDeletion: [],
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is a member or admin of organizations, should: not include those organizations in any arrays', () => {
    const user = createPopulatedUserAccount();
    const org1 = createPopulatedOrganization();
    const org2 = createPopulatedOrganization();

    const actual = mapUserAccountWithMembershipsToDangerZoneProps({
      ...user,
      memberships: [
        {
          organization: { ...org1, _count: { memberships: 1 } },
          role: OrganizationMembershipRole.member,
          deactivatedAt: null,
        },
        {
          organization: { ...org2, _count: { memberships: 2 } },
          role: OrganizationMembershipRole.admin,
          deactivatedAt: null,
        },
      ],
    });
    const expected = {
      imlicitlyDeletedOrganizations: [],
      organizationsBlockingAccountDeletion: [],
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is the owner and only member of organizations, should: include those organizations in implicitly deleted array', () => {
    const user = createPopulatedUserAccount();
    const org1 = createPopulatedOrganization();
    const org2 = createPopulatedOrganization();

    const actual = mapUserAccountWithMembershipsToDangerZoneProps({
      ...user,
      memberships: [
        {
          organization: { ...org1, _count: { memberships: 1 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
        {
          organization: { ...org2, _count: { memberships: 1 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
      ],
    });
    const expected = {
      imlicitlyDeletedOrganizations: [org1.name, org2.name],
      organizationsBlockingAccountDeletion: [],
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is the owner of organizations with other members, should: include those organizations in blocking array', () => {
    const user = createPopulatedUserAccount();
    const org1 = createPopulatedOrganization();
    const org2 = createPopulatedOrganization();

    const actual = mapUserAccountWithMembershipsToDangerZoneProps({
      ...user,
      memberships: [
        {
          organization: { ...org1, _count: { memberships: 2 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
        {
          organization: { ...org2, _count: { memberships: 3 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
      ],
    });
    const expected = {
      imlicitlyDeletedOrganizations: [],
      organizationsBlockingAccountDeletion: [org1.name, org2.name],
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is the owner of organizations with mixed member counts, should: correctly categorize organizations', () => {
    const user = createPopulatedUserAccount();
    const soloOrg = createPopulatedOrganization();
    const multiMemberOrg = createPopulatedOrganization();
    const memberOrg = createPopulatedOrganization();

    const actual = mapUserAccountWithMembershipsToDangerZoneProps({
      ...user,
      memberships: [
        {
          organization: { ...soloOrg, _count: { memberships: 1 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
        {
          organization: { ...multiMemberOrg, _count: { memberships: 3 } },
          role: OrganizationMembershipRole.owner,
          deactivatedAt: null,
        },
        {
          organization: { ...memberOrg, _count: { memberships: 2 } },
          role: OrganizationMembershipRole.member,
          deactivatedAt: null,
        },
      ],
    });
    const expected = {
      imlicitlyDeletedOrganizations: [soloOrg.name],
      organizationsBlockingAccountDeletion: [multiMemberOrg.name],
    };

    expect(actual).toEqual(expected);
  });
});
