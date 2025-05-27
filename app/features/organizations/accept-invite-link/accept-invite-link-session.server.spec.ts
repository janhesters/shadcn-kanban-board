import { addSeconds, subSeconds } from 'date-fns';
import { afterAll, describe, expect, test, vi } from 'vitest';

import { createPopulatedOrganizationInviteLink } from '../organizations-factories.server';
import type { InviteLinkInfoSessionData } from './accept-invite-link-session.server';
import {
  createInviteLinkInfoHeaders,
  destroyInviteLinkInfoSession,
  getInviteLinkInfoFromSession,
} from './accept-invite-link-session.server';

// Helper function adapted from toast.server.spec.ts
const mapHeaders = (headers: Headers): Headers | undefined => {
  const cookie = headers.get('Set-Cookie');
  return cookie ? new Headers({ Cookie: cookie }) : undefined;
};

// Test data factory
const createTestInviteLinkInfo = (
  overrides: Partial<
    InviteLinkInfoSessionData & {
      expiresInSeconds?: number;
      isExpired?: boolean;
    }
  > = {},
): InviteLinkInfoSessionData & { expiresAt: Date } => {
  const expiresInSeconds = overrides.expiresInSeconds ?? 3600; // Default 1 hour
  const expiresAt = overrides.isExpired
    ? subSeconds(new Date(), 10) // 10 seconds in the past
    : addSeconds(new Date(), expiresInSeconds);

  return {
    inviteLinkToken:
      overrides.inviteLinkToken ??
      createPopulatedOrganizationInviteLink().token,
    expiresAt: expiresAt,
  };
};

describe('Invite Link Info Session', () => {
  // Mock console.warn to prevent noise during expired link tests
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // Do nothing
  });

  // Restore mocks after all tests in this describe block
  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('createInviteLinkInfoHeaders() & getInviteLinkInfoFromSession()', () => {
    test('given: valid invite link data, should: create headers with Set-Cookie containing the data', async () => {
      const inviteInfo = createTestInviteLinkInfo({ expiresInSeconds: 3600 });

      const headers = await createInviteLinkInfoHeaders(inviteInfo);
      const cookieHeader = headers.get('Set-Cookie');

      expect(cookieHeader).toBeTruthy();
      expect(cookieHeader).toContain('__invite_link_info=');
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('Path=/');
      expect(cookieHeader).toContain('SameSite=Lax');
      // Approximate check for Max-Age
      const maxAgeMatch = /Max-Age=(\d+);/.exec(cookieHeader!);
      expect(maxAgeMatch).not.toBeNull();
      const maxAge = Number.parseInt(maxAgeMatch![1], 10);
      expect(maxAge).toBeGreaterThan(3590); // ~1 hour minus slight delay
      expect(maxAge).toBeLessThanOrEqual(3600); // 1 hour

      // Now test retrieval
      const request = new Request('http://example.com', {
        headers: mapHeaders(headers),
      });
      const actual = await getInviteLinkInfoFromSession(request);
      const expected: InviteLinkInfoSessionData = {
        inviteLinkToken: inviteInfo.inviteLinkToken,
      };

      expect(actual).toEqual(expected);
    });

    test('given: a request with no session cookie, should: return undefined', async () => {
      const request = new Request('http://example.com');
      const actual = await getInviteLinkInfoFromSession(request);
      const expected: InviteLinkInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });

    test('given: invite link data with expiration in the past, should: return destroying headers and read undefined', async () => {
      const expiredInviteInfo = createTestInviteLinkInfo({ isExpired: true });

      const headers = await createInviteLinkInfoHeaders(expiredInviteInfo);
      const cookieHeader = headers.get('Set-Cookie');

      // Expect a header that expires the cookie immediately
      expect(cookieHeader).toBeTruthy();
      expect(cookieHeader).toContain('__invite_link_info=');
      expect(cookieHeader).toMatch(/Max-Age=0|Expires=.*1970/);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Attempted to create invite link session cookie for already expired link with token: ${expiredInviteInfo.inviteLinkToken}`,
        ),
      );

      // Attempting to read from this "destroyed" cookie should yield undefined
      const request = new Request('http://example.com', {
        headers: mapHeaders(headers),
      });
      const actual = await getInviteLinkInfoFromSession(request);
      const expected: InviteLinkInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });
  });

  describe('destroyInviteLinkInfoSession()', () => {
    test('given: a request with an existing session, should: return headers that expire the cookie', async () => {
      // 1. Create a valid session cookie
      const inviteInfo = createTestInviteLinkInfo();
      const createHeaders = await createInviteLinkInfoHeaders(inviteInfo);
      const requestWithCookie = new Request('http://example.com', {
        headers: mapHeaders(createHeaders),
      });

      // 2. Call destroy session
      const destroyHeaders =
        await destroyInviteLinkInfoSession(requestWithCookie);
      const destroyCookieHeader = destroyHeaders.get('Set-Cookie');

      // 3. Assert the destroy header is correct
      expect(destroyCookieHeader).toBeTruthy();
      expect(destroyCookieHeader).toContain('__invite_link_info=;');
      expect(destroyCookieHeader).toContain('Path=/');
      expect(destroyCookieHeader).toMatch(/Max-Age=0|Expires=.*1970/); // Check for immediate expiry
      expect(destroyCookieHeader).toContain('HttpOnly');
      expect(destroyCookieHeader).toContain('SameSite=Lax');

      // 4. Verify reading after destruction yields undefineds
      const requestAfterDestroy = new Request('http://example.com', {
        headers: mapHeaders(destroyHeaders), // Use the destroy header
      });
      const actual = await getInviteLinkInfoFromSession(requestAfterDestroy);
      const expected: InviteLinkInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });

    test('given: a request with no session, should: still return expiring headers', async () => {
      const requestWithoutCookie = new Request('http://example.com');

      const destroyHeaders =
        await destroyInviteLinkInfoSession(requestWithoutCookie);
      const destroyCookieHeader = destroyHeaders.get('Set-Cookie');

      // Assert the destroy header is correct, even if no cookie existed
      expect(destroyCookieHeader).toBeTruthy();
      expect(destroyCookieHeader).toContain('__invite_link_info=;');
      expect(destroyCookieHeader).toMatch(/Max-Age=0|Expires=.*1970/);
    });
  });
});
