import { describe, expect, test } from 'vitest';

import { createPopulatedOrganization } from '../organizations-factories.server';
import {
  createCookieForOrganizationSwitcherSession,
  destroyOrganizationSwitcherSession,
  getCurrentOrganizationIdFromSession,
} from './organization-switcher-session.server';

describe('organization switcher session', () => {
  describe('createCookieForOrganizationSwitcherSession() & getCurrentOrganizationIdFromSession()', () => {
    test('given: a request with no session and an organizationId, should: create a cookie and return the organizationId', async () => {
      const organizationId = createPopulatedOrganization().id;
      const initialRequest = new Request('http://example.com');

      const setCookie = await createCookieForOrganizationSwitcherSession(
        initialRequest,
        organizationId,
      );
      const newRequest = new Request('http://example.com', {
        headers: { Cookie: setCookie },
      });

      const actual = await getCurrentOrganizationIdFromSession(newRequest);
      const expected = organizationId;

      expect(actual).toEqual(expected);
    });

    test('given: a request with no session, should: return undefined', async () => {
      const request = new Request('http://example.com');

      const actual = await getCurrentOrganizationIdFromSession(request);
      const expected = undefined;

      expect(actual).toEqual(expected);
    });

    test('given: a request with an existing organizationId and a new organizationId, should: update and return the new organizationId', async () => {
      const initialOrganizationId = createPopulatedOrganization().id;
      const initialRequest = new Request('http://example.com');
      const setCookie1 = await createCookieForOrganizationSwitcherSession(
        initialRequest,
        initialOrganizationId,
      );
      const request1 = new Request('http://example.com', {
        headers: { Cookie: setCookie1 },
      });
      const newOrganizationId = createPopulatedOrganization().id;
      const setCookie2 = await createCookieForOrganizationSwitcherSession(
        request1,
        newOrganizationId,
      );
      const request2 = new Request('http://example.com', {
        headers: { Cookie: setCookie2 },
      });

      const actual = await getCurrentOrganizationIdFromSession(request2);
      const expected = newOrganizationId;

      expect(actual).toEqual(expected);
    });
  });

  describe('destroyOrganizationSwitcherSession()', () => {
    test('given: a request with an existing organizationId, should: destroy the cookie', async () => {
      const organizationId = createPopulatedOrganization().id;
      const request = new Request('http://example.com');
      const setCookie = await createCookieForOrganizationSwitcherSession(
        request,
        organizationId,
      );
      const newRequest = new Request('http://example.com', {
        headers: { Cookie: setCookie },
      });

      const actual = await destroyOrganizationSwitcherSession(newRequest);
      const expected =
        '__organization_switcher=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';

      expect(actual).toEqual(expected);
    });
  });
});
