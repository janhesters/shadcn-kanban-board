import { describe, expect, onTestFinished, test } from 'vitest';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { loginIntents } from '~/features/user-authentication/user-authentication-constants';
import {
  createRateLimitedEmail,
  supabaseHandlers,
} from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import {
  badRequest,
  tooManyRequests,
  unauthorized,
} from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';

import { action } from './login';

const createUrl = () => `http://localhost:3000/login`;

async function sendRequest({ formData }: { formData: FormData }) {
  const request = new Request(createUrl(), {
    method: 'POST',
    body: formData,
  });

  return await action({ request, context: {}, params: {} });
}

setupMockServerLifecycle(...supabaseHandlers);

describe('/login route action', () => {
  test('given: an authenticated request, should: throw a redirect to the organizations page', async () => {
    expect.assertions(2);

    const userAccount = createPopulatedUserAccount();
    await saveUserAccountToDatabase(userAccount);
    onTestFinished(async () => {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    });
    const request = await createAuthenticatedRequest({
      url: createUrl(),
      user: userAccount,
      method: 'POST',
      formData: toFormData({}),
    });

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual('/organizations');
      }
    }
  });

  test('given: an invalid intent, should: return a 400 status code with an error message', async () => {
    const formData = toFormData({ intent: 'invalid-intent' });

    const actual = await sendRequest({ formData });
    const expected = badRequest({
      errors: {
        intent: {
          message:
            "Invalid discriminator value. Expected 'loginWithEmail' | 'loginWithGoogle'",
        },
      },
    });

    expect(actual).toEqual(expected);
  });

  test('given: no intent, should: return a 400 status code with an error message', async () => {
    const formData = toFormData({});

    const actual = await sendRequest({ formData });
    const expected = badRequest({
      errors: {
        intent: {
          message:
            "Invalid discriminator value. Expected 'loginWithEmail' | 'loginWithGoogle'",
        },
      },
    });

    expect(actual).toEqual(expected);
  });

  describe(`${loginIntents.loginWithEmail} intent`, () => {
    const intent = loginIntents.loginWithEmail;

    test("given: a valid email for an existing user, should: return the user's email with no session or user", async () => {
      const userAccount = createPopulatedUserAccount();
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });
      const formData = toFormData({ intent, email: userAccount.email });

      const actual = await sendRequest({ formData });
      const expected = { email: userAccount.email, session: null, user: null };

      expect(actual).toEqual(expected);
    });

    test.each([
      {
        given: 'no email',
        body: { intent },
        expected: badRequest({ errors: { email: { message: 'Required' } } }),
      },
      {
        given: 'an invalid email',
        body: { intent, email: 'invalid-email' },
        expected: badRequest({
          errors: {
            email: { message: 'user-authentication:common.email-invalid' },
          },
        }),
      },
    ])(
      'given: $given, should: return a 400 status code with an error message',
      async ({ body, expected }) => {
        const formData = toFormData(body);

        const actual = await sendRequest({ formData });
        expect(actual).toEqual(expected);
      },
    );

    test('given: a valid email for a non-existent user, should: return a 401 status code with an error message', async () => {
      const formData = toFormData({ intent, email: 'test@example.com' });

      const actual = await sendRequest({ formData });
      const expected = unauthorized({
        errors: {
          email: {
            message: 'user-authentication:login.form.user-doesnt-exist',
          },
        },
      });

      expect(actual).toEqual(expected);
    });

    test('given: too many requests in a short time, should: return a 429 status code with an error message', async () => {
      const email = createRateLimitedEmail();
      const userAccount = createPopulatedUserAccount({ email });
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });
      const formData = toFormData({ intent, email });

      const actual = await sendRequest({ formData });
      const expected = tooManyRequests({
        errors: {
          email: {
            message: 'user-authentication:login.form.login-failed',
          },
        },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe(`${loginIntents.loginWithGoogle} intent`, () => {
    const intent = loginIntents.loginWithGoogle;

    test('given: a login request with Google, should: return a redirect response to Supabase OAuth URL with code_verifier cookie', async () => {
      const formData = toFormData({ intent });

      const response = (await sendRequest({ formData })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toMatch(
        /^https:\/\/.*\.supabase\.co\/auth\/v1\/authorize\?provider=google/,
      );
      expect(response.headers.get('Set-Cookie')).toMatch(
        /sb-.*-auth-token-code-verifier=/,
      );
    });
  });
});
