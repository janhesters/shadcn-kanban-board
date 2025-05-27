import { describe, expect, test } from 'vitest';

import {
  getSearchParameterFromRequest,
  requestToUrl,
} from './get-search-parameter-from-request.server';

describe('requestToUrl()', () => {
  test('given: a request with a url, should: return a URL object for it', () => {
    const url = 'https://www.mozilla.org/favicon.ico';

    const actual = requestToUrl(new Request(url));
    const expected = new URL(url);

    expect(actual).toEqual(expected);
  });
});

describe('getSearchParameterFromRequest()', () => {
  test('given: a request and a search parameter that is in the request url, should: return the value of the search parameter', () => {
    const searchParameter = 'redirectTo';
    const request = new Request(
      `https://example.com?${searchParameter}=home&foo=bar`,
    );

    const actual = getSearchParameterFromRequest(searchParameter)(request);
    const expected = 'home';

    expect(actual).toEqual(expected);
  });

  test("given: a request and a search parameter that is NOT in the request's url, should: return an empty string", () => {
    const searchParameter = 'filterUsers';
    const request = new Request(`https://example.com?foo=bar`);

    const actual = getSearchParameterFromRequest(searchParameter)(request);
    const expected = '';

    expect(actual).toEqual(expected);
  });
});
