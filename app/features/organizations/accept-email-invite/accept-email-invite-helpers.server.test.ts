import { describe, expect, test } from 'vitest';

import { createPopulatedOrganizationEmailInviteLink } from '../organizations-factories.server';
import { getEmailInviteToken } from './accept-email-invite-helpers.server';

describe('getEmailInviteToken()', () => {
  test('given: request with token query param, should: return the token', () => {
    const token = createPopulatedOrganizationEmailInviteLink().token;
    const request = new Request(`http://example.com/?token=${token}`);

    const actual = getEmailInviteToken(request);

    expect(actual).toEqual(token);
  });

  test('given: request without token query param, should: return empty string', () => {
    const request = new Request('http://example.com');

    const actual = getEmailInviteToken(request);
    const expected = '';

    expect(actual).toEqual(expected);
  });

  test('given: request with multiple token query params, should: return first token', () => {
    const token1 = createPopulatedOrganizationEmailInviteLink().token;
    const token2 = createPopulatedOrganizationEmailInviteLink().token;
    const request = new Request(
      `http://example.com/?token=${token1}&token=${token2}`,
    );

    const actual = getEmailInviteToken(request);

    expect(actual).toEqual(token1);
  });
});
