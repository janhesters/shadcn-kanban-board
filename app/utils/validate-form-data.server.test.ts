import { describe, expect, test } from 'vitest';
import { z } from 'zod';

import { validateFormData } from './validate-form-data.server';

const createRequest = (formDataEntries: [string, string][]) => {
  const formData = new FormData();
  for (const [key, value] of formDataEntries) formData.append(key, value);

  return new Request('http://localhost', {
    method: 'POST',
    body: formData,
  });
};

const registerIntents = {
  registerWithEmail: 'registerWithEmail',
  registerWithGoogle: 'registerWithGoogle',
} as const;

const registerWithEmailSchema = z.object({
  intent: z.literal(registerIntents.registerWithEmail),
  username: z.string().min(3),
  email: z.string().email(),
});

const registerWithGoogleSchema = z.object({
  intent: z.literal(registerIntents.registerWithGoogle),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' }),
});

const testSchema = z
  .discriminatedUnion('intent', [
    registerWithEmailSchema,
    registerWithGoogleSchema,
  ])
  .refine(data => data.username !== 'admin', {
    message: 'Username "admin" is reserved',
    path: [],
  });

describe('validateFormData()', () => {
  test('given: valid email registration data, should: return parsed data', async () => {
    const request = createRequest([
      ['intent', 'registerWithEmail'],
      ['username', 'john_doe'],
      ['email', 'john@example.com'],
    ]);

    const actual = await validateFormData(request, testSchema);
    const expected = {
      intent: 'registerWithEmail',
      username: 'john_doe',
      email: 'john@example.com',
    };

    expect(actual).toEqual(expected);
  });

  test('given: valid google registration data, should: return parsed data', async () => {
    const request = createRequest([
      ['intent', 'registerWithGoogle'],
      ['username', 'john_doe'],
    ]);

    const actual = await validateFormData(request, testSchema);
    const expected = {
      intent: 'registerWithGoogle',
      username: 'john_doe',
    };

    expect(actual).toEqual(expected);
  });

  test('given: missing intent, should: throw badRequest with error for intent', async () => {
    const request = createRequest([
      ['username', 'john_doe'],
      ['email', 'john@example.com'],
    ]);

    const expectedErrors = {
      errors: {
        intent: {
          message:
            "Invalid discriminator value. Expected 'registerWithEmail' | 'registerWithGoogle'",
        },
      },
    };

    await expect(validateFormData(request, testSchema)).rejects.toEqual({
      data: { message: 'Bad Request', ...expectedErrors },
      init: { status: 400 },
      type: 'DataWithResponseInit',
    });
  });

  test('given: reserved username, should: throw badRequest with form error', async () => {
    const request = createRequest([
      ['intent', 'registerWithEmail'],
      ['username', 'admin'],
      ['email', 'john@example.com'],
    ]);

    const expectedErrors = {
      errors: { root: { message: 'Username "admin" is reserved' } },
    };

    await expect(validateFormData(request, testSchema)).rejects.toEqual({
      data: { message: 'Bad Request', ...expectedErrors },
      init: { status: 400 },
      type: 'DataWithResponseInit',
    });
  });

  test('given: email registration with invalid email, should: throw badRequest with error for email', async () => {
    const request = createRequest([
      ['intent', 'registerWithEmail'],
      ['username', 'john_doe'],
      ['email', 'not-an-email'],
    ]);

    const expectedErrors = { errors: { email: { message: 'Invalid email' } } };

    await expect(validateFormData(request, testSchema)).rejects.toEqual({
      data: { message: 'Bad Request', ...expectedErrors },
      init: { status: 400 },
      type: 'DataWithResponseInit',
    });
  });

  test('given: google registration with short username, should: throw badRequest with error for username', async () => {
    const request = createRequest([
      ['intent', 'registerWithGoogle'],
      ['username', 'jo'],
    ]);

    const expectedErrors = {
      errors: {
        username: { message: 'Username must be at least 3 characters long' },
      },
    };

    await expect(validateFormData(request, testSchema)).rejects.toEqual({
      data: { message: 'Bad Request', ...expectedErrors },
      init: { status: 400 },
      type: 'DataWithResponseInit',
    });
  });

  test('given: multiple errors including reserved username, should: throw badRequest with form and field errors', async () => {
    const request = createRequest([
      ['intent', 'registerWithEmail'],
      ['username', 'admin'],
      ['email', 'not-an-email'],
    ]);

    const expectedErrors = {
      errors: {
        email: { message: 'Invalid email' },
        root: { message: 'Username "admin" is reserved' },
      },
    };

    await expect(validateFormData(request, testSchema)).rejects.toEqual({
      data: { message: 'Bad Request', ...expectedErrors },
      init: { status: 400 },
      type: 'DataWithResponseInit',
    });
  });
});
