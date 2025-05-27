import { describe, expect, test } from 'vitest';

import { getIsAwaitingEmailConfirmation } from './user-authentication-helpers';

describe('getIsAwaitingEmailConfirmation()', () => {
  test('given: a valid AuthOtpResponse data with email, should: return true', () => {
    const data = { session: null, user: null, email: 'test@example.com' };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: an object missing session property, should: return false', () => {
    const data = { user: null, email: 'test@example.com' };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object missing user property, should: return false', () => {
    const data = { session: null, email: 'test@example.com' };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object missing email property, should: return false', () => {
    const data = { session: null, user: null };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object with non-null session, should: return false', () => {
    const data = { session: {}, user: null, email: 'test@example.com' };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object with non-null user, should: return false', () => {
    const data = {
      session: null,
      user: {},
      email: 'test@example.com',
    };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: an object with non-string email, should: return false', () => {
    const data = { session: null, user: null, email: 123 };

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: null, should: return false', () => {
    const data = null;

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: undefined, should: return false', () => {
    const data = undefined;

    const actual = getIsAwaitingEmailConfirmation(data);
    const expected = false;

    expect(actual).toEqual(expected);
  });
});
