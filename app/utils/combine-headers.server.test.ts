import { describe, expect, test } from 'vitest';

import { combineHeaders } from './combine-headers.server';

/**
 * Converts a headers object to a plain object while normalizing the headers to
 * lowercase.
 *
 * NOTE: This is a helper function for testing purposes only. The real headers
 * won't be normalized to lowercase. We need this function because Vitest can't
 * compare Headers objects.
 *
 * @param headers - A Headers object.
 * @returns A headers object with the keys normalized to lowercase.
 */
const headersToObject = (headers: Headers) =>
  Object.fromEntries(headers.entries());

describe('combineHeaders()', () => {
  test('given: multiple headers objects, should: return a combined headers object', () => {
    const headers1 = new Headers({ 'Content-Type': 'application/json' });
    const headers2 = new Headers({ Accept: 'application/xml' });

    const actual = headersToObject(combineHeaders(headers1, headers2));
    const expected = {
      'content-type': 'application/json',
      accept: 'application/xml',
    };

    expect(actual).toEqual(expected);
  });

  test('given: headers with overlapping keys, should: return a combined headers object with appended values', () => {
    const headers1 = new Headers({ 'Cache-Control': 'no-cache' });
    const headers2 = new Headers({ 'Cache-Control': 'no-store' });

    const actual = headersToObject(combineHeaders(headers1, headers2));
    const expected = { 'cache-control': 'no-cache, no-store' };

    expect(actual).toEqual(expected);
  });

  test('given: null or undefined headers, should: return a combined headers object excluding null or undefined headers', () => {
    const headers = new Headers({ 'X-Custom-Header': 'value1' });

    const actual = headersToObject(combineHeaders(headers, undefined, null));
    const expected = { 'x-custom-header': 'value1' };

    expect(actual).toEqual(expected);
  });

  test('given: no headers, should: return an empty headers object', () => {
    const actual = headersToObject(combineHeaders());
    const expected = {};

    expect(actual).toEqual(expected);
  });
});
