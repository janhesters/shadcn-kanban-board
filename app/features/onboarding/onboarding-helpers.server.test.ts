import { faker } from '@faker-js/faker';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createOnboardingUser } from '~/test/test-utils';

import { createPopulatedOrganization } from '../organizations/organizations-factories.server';
import {
  getUserIsOnboarded,
  redirectUserToOnboardingStep,
  throwIfUserIsOnboarded,
  throwIfUserNeedsOnboarding,
} from './onboarding-helpers.server';

describe('getUserIsOnboarded()', () => {
  test('given a user with no memberships and no name: returns false', () => {
    const user = createOnboardingUser({ name: '', memberships: [] });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given a user with memberships but no name: returns false', () => {
    const user = createOnboardingUser({ name: '' });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given a user with a name but no memberships: returns false', () => {
    const user = createOnboardingUser({ memberships: [] });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given a user with both a name and memberships: returns true', () => {
    const user = createOnboardingUser();

    const actual = getUserIsOnboarded(user);
    const expected = true;

    expect(actual).toEqual(expected);
  });
});

describe('throwIfUserIsOnboarded()', () => {
  test('given: a user with no name and no memberships, should: return the user', () => {
    const user = createOnboardingUser({ name: '', memberships: [] });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    const actual = throwIfUserIsOnboarded(user, headers);
    const expected = user;

    expect(actual).toEqual(expected);
  });

  test('given: an onboarded user with exactly one organization, should: redirect to the organization page', () => {
    expect.assertions(3);

    const user = createOnboardingUser({
      name: 'Test User',
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: createPopulatedOrganization(),
          deactivatedAt: null,
        },
      ],
    });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    try {
      throwIfUserIsOnboarded(user, headers);
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/organizations/${user.memberships[0].organization.slug}`,
        );
        expect([...error.headers.entries()]).toEqual([
          [
            'location',
            `/organizations/${user.memberships[0].organization.slug}`,
          ],
          ...headers.entries(),
        ]);
      }
    }
  });

  test('given: an onboarded user with multiple organizations, should: redirect to the organizations page', () => {
    expect.assertions(3);

    const user = createOnboardingUser({
      name: 'Test User',
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: createPopulatedOrganization(),
          deactivatedAt: null,
        },
        {
          role: OrganizationMembershipRole.member,
          organization: createPopulatedOrganization(),
          deactivatedAt: null,
        },
      ],
    });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    try {
      throwIfUserIsOnboarded(user, headers);
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual('/organizations');
        expect([...error.headers.entries()]).toEqual([
          ['location', '/organizations'],
          ...headers.entries(),
        ]);
      }
    }
  });

  test('given: a user with memberships but no name, should: return the user', () => {
    const user = createOnboardingUser({ name: '' });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    const actual = throwIfUserIsOnboarded(user, headers);
    const expected = user;

    expect(actual).toEqual(expected);
  });

  test('given: a user with a name but no memberships, should: return the user', () => {
    const user = createOnboardingUser({
      name: 'Test User',
      memberships: [],
    });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    const actual = throwIfUserIsOnboarded(user, headers);
    const expected = user;

    expect(actual).toEqual(expected);
  });
});

describe('redirectUserToOnboardingStep()', () => {
  describe('user account onboarding page', () => {
    test('given: a request to the user account onboarding page and a user has neither a name, nor organizations yet, should: return the user', () => {
      const url = 'http://localhost:3000/onboarding/user-account';
      const method = faker.internet.httpMethod();
      const request = new Request(url, { method });
      const user = createOnboardingUser({ name: '', memberships: [] });
      const headers = new Headers({ 'X-Test-Header': 'test-value' });

      const actual = redirectUserToOnboardingStep(request, user, headers);
      const expected = { user, headers };

      expect(actual).toEqual(expected);
    });

    test.each([
      faker.internet.url(),
      'http://localhost:3000/onboarding/organization',
    ])(
      'given: any other request (to %s) and the user has no name, and is NOT a member of any organizations yet, should: redirect the user to the organization onboarding page',
      url => {
        expect.assertions(3);

        const user = createOnboardingUser({ name: '', memberships: [] });
        const method = faker.internet.httpMethod();
        const request = new Request(url, { method });
        const headers = new Headers({ 'X-Test-Header': 'test-value' });

        try {
          redirectUserToOnboardingStep(request, user, headers);
        } catch (error) {
          if (error instanceof Response) {
            expect(error.status).toEqual(302);
            expect(error.headers.get('Location')).toEqual(
              '/onboarding/user-account',
            );
            expect([...error.headers.entries()]).toEqual([
              ['location', '/onboarding/user-account'],
              ...headers.entries(),
            ]);
          }
        }
      },
    );
  });

  describe('organization onboarding page', () => {
    test('given: a request to the organization onboarding page and a user that is NOT a member of any organizations yet, should: return the user', () => {
      const user = createOnboardingUser({ memberships: [] });
      const url = 'http://localhost:3000/onboarding/organization';
      const method = faker.internet.httpMethod();
      const request = new Request(url, { method });
      const headers = new Headers({ 'X-Test-Header': 'test-value' });

      const actual = redirectUserToOnboardingStep(request, user, headers);
      const expected = { user, headers };

      expect(actual).toEqual(expected);
    });

    test.each([
      faker.internet.url(),
      'http://localhost:3000/onboarding/future-step',
    ])(
      'given: any other request (to %s) and a user that is NOT a member of any organizations yet, should: redirect the user to the organization onboarding page',
      url => {
        expect.assertions(3);

        const user = createOnboardingUser({ memberships: [] });
        const method = faker.internet.httpMethod();
        const request = new Request(url, { method });
        const headers = new Headers({ 'X-Test-Header': 'test-value' });

        try {
          redirectUserToOnboardingStep(request, user, headers);
        } catch (error) {
          if (error instanceof Response) {
            expect(error.status).toEqual(302);
            expect(error.headers.get('Location')).toEqual(
              '/onboarding/organization',
            );
            expect([...error.headers.entries()]).toEqual([
              ['location', '/onboarding/organization'],
              ...headers.entries(),
            ]);
          }
        }
      },
    );
  });
});

describe('throwIfUserNeedsOnboarding()', () => {
  test('given: a user with both a name and memberships, should: return the user', () => {
    const user = createOnboardingUser();
    const headers = new Headers();

    const actual = throwIfUserNeedsOnboarding({ user, headers });
    const expected = { user, headers };

    expect(actual).toEqual(expected);
  });

  test('given: a user with no memberships, should: redirect to the onboarding page', () => {
    expect.assertions(3);

    const user = createOnboardingUser({ memberships: [] });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    try {
      throwIfUserNeedsOnboarding({ user, headers });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual('/onboarding');
        expect([...error.headers.entries()]).toEqual([
          ['location', '/onboarding'],
          ...headers.entries(),
        ]);
      }
    }
  });

  test('given: a user with no name, should: redirect to the onboarding page', () => {
    expect.assertions(3);

    const user = createOnboardingUser({ name: '' });
    const headers = new Headers({ 'X-Test-Header': 'test-value' });

    try {
      throwIfUserNeedsOnboarding({ user, headers });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual('/onboarding');
        expect([...error.headers.entries()]).toEqual([
          ['location', '/onboarding'],
          ...headers.entries(),
        ]);
      }
    }
  });
});
