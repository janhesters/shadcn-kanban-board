import { describe, expect, test } from 'vitest';

import { getIsResponse } from './get-is-response';
import { badRequest } from './http-responses.server';

describe('getIsResponse()', () => {
  test('given: a response, should: return true', () => {
    const response = new Response('Hello, world!');

    const actual = getIsResponse(response);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: a custom response, should: return true', () => {
    const response = badRequest();

    const actual = getIsResponse(response);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: an error, should: return false', () => {
    const error = new Error('Hello, world!');

    const actual = getIsResponse(error);
    const expected = false;

    expect(actual).toEqual(expected);
  });
});
