import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createOnboardingUser } from '~/test/test-utils';
import { notFound } from '~/utils/http-responses.server';

import { createPopulatedOrganization } from './organizations-factories.server';
import {
  findOrganizationIfUserIsMemberById,
  findOrganizationIfUserIsMemberBySlug,
} from './organizations-helpers.server';

describe('findOrganizationIfUserIsMemberBySlug()', () => {
  test('given: a user who is a member of the organization, should: return the organization and role', () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization,
          deactivatedAt: null,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberBySlug(
      user,
      organization.slug,
    );
    const expected = {
      organization: user.memberships[0].organization,
      role: OrganizationMembershipRole.member,
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is an admin of the organization, should: return the organization and admin role', () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.admin,
          organization,
          deactivatedAt: null,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberBySlug(
      user,
      organization.slug,
    );
    const expected = {
      organization: user.memberships[0].organization,
      role: OrganizationMembershipRole.admin,
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is not a member of the organization, should: throw a 404', () => {
    expect.assertions(1);

    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: createPopulatedOrganization(),
          deactivatedAt: null,
        },
      ],
    });
    const nonExistentSlug = createPopulatedOrganization().slug;

    try {
      findOrganizationIfUserIsMemberBySlug(user, nonExistentSlug);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });

  test('given: a user with no memberships, should: throw a 404', () => {
    expect.assertions(1);

    const user = createOnboardingUser({ memberships: [] });
    const organizationSlug = createPopulatedOrganization().slug;

    try {
      findOrganizationIfUserIsMemberBySlug(user, organizationSlug);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });
});

describe('findOrganizationIfUserIsMemberById()', () => {
  test('given: a user who is a member of the organization, should: return the organization and role', () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization,
          deactivatedAt: null,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberById(user, organization.id);
    const expected = {
      organization: user.memberships[0].organization,
      role: OrganizationMembershipRole.member,
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is an admin of the organization, should: return the organization and admin role', () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.admin,
          organization,
          deactivatedAt: null,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberById(user, organization.id);
    const expected = {
      organization: user.memberships[0].organization,
      role: OrganizationMembershipRole.admin,
    };

    expect(actual).toEqual(expected);
  });

  test('given: a user who is not a member of the organization, should: throw a 404', () => {
    expect.assertions(1);

    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: createPopulatedOrganization(),
          deactivatedAt: null,
        },
      ],
    });
    const nonExistentId = createPopulatedOrganization().id;

    try {
      findOrganizationIfUserIsMemberById(user, nonExistentId);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });

  test('given: a user with no memberships, should: throw a 404', () => {
    expect.assertions(1);

    const user = createOnboardingUser({ memberships: [] });
    const organizationId = createPopulatedOrganization().id;

    try {
      findOrganizationIfUserIsMemberById(user, organizationId);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });
});
