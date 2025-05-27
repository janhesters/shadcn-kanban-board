import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { notFound } from '~/utils/http-responses.server';

import {
  createPopulatedOrganization,
  createPopulatedOrganizationInviteLink,
} from '../organizations-factories.server';
import {
  getInviteLinkToken,
  throwIfInviteLinkIsExpired,
} from './accept-invite-link-helpers.server';

describe('throwIfInviteLinkIsExpired()', () => {
  test('given: a valid invite link, should: return the link', () => {
    const link = {
      id: createPopulatedOrganizationInviteLink().id,
      expiresAt: createPopulatedOrganizationInviteLink().expiresAt,
      organization: {
        id: createPopulatedOrganization().name,
        name: createPopulatedOrganization().name,
      },
      creator: {
        id: createPopulatedUserAccount().id,
        name: createPopulatedUserAccount().name,
      },
    };

    const actual = throwIfInviteLinkIsExpired(link);
    const expected = link;

    expect(actual).toEqual(expected);
  });

  test('given: an expired invite link, should: throw a 404 error', () => {
    expect.assertions(1);

    const link = {
      id: createPopulatedOrganizationInviteLink().id,
      expiresAt: faker.date.recent(),
      organization: {
        id: createPopulatedOrganization().name,
        name: createPopulatedOrganization().name,
      },
      creator: {
        id: createPopulatedUserAccount().id,
        name: createPopulatedUserAccount().name,
      },
    };

    try {
      throwIfInviteLinkIsExpired(link);
    } catch (error) {
      if (getIsDataWithResponseInit(error)) {
        expect(error).toEqual(notFound());
      }
    }
  });
});

describe('getInviteLinkToken()', () => {
  test('given a request with token query param: returns the token', () => {
    const token = createPopulatedOrganizationInviteLink().token;
    const request = new Request(`http://example.com/?token=${token}`);

    const actual = getInviteLinkToken(request);

    expect(actual).toEqual(token);
  });

  test('given a request without a token query param: returns an empty string', () => {
    const request = new Request('http://example.com');

    const actual = getInviteLinkToken(request);
    const expected = '';

    expect(actual).toEqual(expected);
  });

  test('given a request with multiple token query params: returns the first token', () => {
    const token1 = createPopulatedOrganizationInviteLink().token;
    const token2 = createPopulatedOrganizationInviteLink().token;
    const request = new Request(
      `http://example.com/?token=${token1}&token=${token2}`,
    );

    const actual = getInviteLinkToken(request);

    expect(actual).toEqual(token1);
  });
});
