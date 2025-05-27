import { data } from 'react-router';
import { describe, expect, test } from 'vitest';

import { getIsDataWithResponseInit } from './get-is-data-with-response-init.server';

describe('getIsDataWithResponseInit()', () => {
  test('given: a data with response init object, should: return true', () => {
    const response = data({});

    const actual = getIsDataWithResponseInit(response);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: a normal response, should: return false', () => {
    const response = new Response();

    const actual = getIsDataWithResponseInit(response);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: any object, should: return false', () => {
    const actual = getIsDataWithResponseInit({});
    const expected = false;

    expect(actual).toEqual(expected);
  });
});
