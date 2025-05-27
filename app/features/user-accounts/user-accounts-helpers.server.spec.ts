import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';

import { createPopulatedUserAccount } from './user-accounts-factories.server';
import { throwIfUserAccountIsMissing } from './user-accounts-helpers.server';

setupMockServerLifecycle(...supabaseHandlers);

describe('throwIfUserAccountIsMissing()', () => {
  test('given: a request and a user account, should: return the user account', async () => {
    const request = new Request(faker.internet.url());
    const userAccount = createPopulatedUserAccount();

    const actual = await throwIfUserAccountIsMissing(request, userAccount);
    const expected = userAccount;

    expect(actual).toEqual(expected);
  });

  test('given: a request and null, should: throw a redirect to the login page and log the user out', async () => {
    expect.assertions(3);
    const request = await createAuthenticatedRequest({
      url: faker.internet.url(),
      user: createPopulatedUserAccount(),
    });

    try {
      await throwIfUserAccountIsMissing(request, null);
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual('/login');
        expect(error.headers.get('Set-Cookie')).toMatch(
          /sb-.*-auth-token=; Max-Age=0; Path=\/; SameSite=Lax/,
        );
      }
    }
  });
});
