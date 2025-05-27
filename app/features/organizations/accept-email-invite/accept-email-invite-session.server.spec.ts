import { addSeconds, subSeconds } from 'date-fns';
import { afterAll, describe, expect, test, vi } from 'vitest';

import { createPopulatedOrganizationEmailInviteLink } from '../organizations-factories.server';
import type { EmailInviteInfoSessionData } from './accept-email-invite-session.server';
import {
  createEmailInviteInfoHeaders,
  destroyEmailInviteInfoSession,
  getEmailInviteInfoFromSession,
} from './accept-email-invite-session.server';

// Helper function adapted from toast.server.spec.ts
const mapHeaders = (headers: Headers): Headers | undefined => {
  const cookie = headers.get('Set-Cookie');
  return cookie ? new Headers({ Cookie: cookie }) : undefined;
};

// Test data factory
const createTestEmailInviteInfo = (
  overrides: Partial<
    EmailInviteInfoSessionData & {
      expiresInSeconds?: number;
      isExpired?: boolean;
    }
  > = {},
): EmailInviteInfoSessionData & { expiresAt: Date } => {
  const expiresInSeconds = overrides.expiresInSeconds ?? 3600; // Default 1 hour
  const expiresAt = overrides.isExpired
    ? subSeconds(new Date(), 10) // 10 seconds in the past
    : addSeconds(new Date(), expiresInSeconds);

  return {
    emailInviteToken:
      overrides.emailInviteToken ??
      createPopulatedOrganizationEmailInviteLink().token,
    expiresAt: expiresAt,
  };
};

describe('Email Invite Info Session', () => {
  // Mock console.warn to prevent noise during expired invite tests
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // Do nothing
  });

  // Restore mocks after all tests in this describe block
  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('createEmailInviteInfoHeaders() & getEmailInviteInfoFromSession()', () => {
    test('given: valid email invite data, should: create headers with Set-Cookie containing the data', async () => {
      const inviteInfo = createTestEmailInviteInfo({ expiresInSeconds: 3600 });

      const headers = await createEmailInviteInfoHeaders(inviteInfo);
      const cookieHeader = headers.get('Set-Cookie');

      expect(cookieHeader).toBeTruthy();
      expect(cookieHeader).toContain('__email_invite_info=');
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
      const actual = await getEmailInviteInfoFromSession(request);
      const expected: EmailInviteInfoSessionData = {
        emailInviteToken: inviteInfo.emailInviteToken,
      };

      expect(actual).toEqual(expected);
    });

    test('given: a request with no session cookie, should: return undefined', async () => {
      const request = new Request('http://example.com');
      const actual = await getEmailInviteInfoFromSession(request);
      const expected: EmailInviteInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });

    test('given: email invite data with expiration in the past, should: return destroying headers and read undefined', async () => {
      const expiredInviteInfo = createTestEmailInviteInfo({ isExpired: true });

      const headers = await createEmailInviteInfoHeaders(expiredInviteInfo);
      const cookieHeader = headers.get('Set-Cookie');

      // Expect a header that expires the cookie immediately
      expect(cookieHeader).toBeTruthy();
      expect(cookieHeader).toContain('__email_invite_info=');
      expect(cookieHeader).toMatch(/Max-Age=0|Expires=.*1970/);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Attempted to create email invite session cookie for already expired invite with token: ${expiredInviteInfo.emailInviteToken}`,
        ),
      );

      // Attempting to read from this "destroyed" cookie should yield undefined
      const request = new Request('http://example.com', {
        headers: mapHeaders(headers),
      });
      const actual = await getEmailInviteInfoFromSession(request);
      const expected: EmailInviteInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });
  });

  describe('destroyEmailInviteInfoSession()', () => {
    test('given: a request with an existing session, should: return headers that expire the cookie', async () => {
      // 1. Create a valid session cookie
      const inviteInfo = createTestEmailInviteInfo();
      const createHeaders = await createEmailInviteInfoHeaders(inviteInfo);
      const requestWithCookie = new Request('http://example.com', {
        headers: mapHeaders(createHeaders),
      });

      // 2. Call destroy session
      const destroyHeaders =
        await destroyEmailInviteInfoSession(requestWithCookie);
      const destroyCookieHeader = destroyHeaders.get('Set-Cookie');

      // 3. Assert the destroy header is correct
      expect(destroyCookieHeader).toBeTruthy();
      expect(destroyCookieHeader).toContain('__email_invite_info=;');
      expect(destroyCookieHeader).toContain('Path=/');
      expect(destroyCookieHeader).toMatch(/Max-Age=0|Expires=.*1970/); // Check for immediate expiry
      expect(destroyCookieHeader).toContain('HttpOnly');
      expect(destroyCookieHeader).toContain('SameSite=Lax');

      // 4. Verify reading after destruction yields undefineds
      const requestAfterDestroy = new Request('http://example.com', {
        headers: mapHeaders(destroyHeaders), // Use the destroy header
      });
      const actual = await getEmailInviteInfoFromSession(requestAfterDestroy);
      const expected: EmailInviteInfoSessionData | undefined = undefined;

      expect(actual).toEqual(expected);
    });

    test('given: a request with no session, should: still return expiring headers', async () => {
      const requestWithoutCookie = new Request('http://example.com');

      const destroyHeaders =
        await destroyEmailInviteInfoSession(requestWithoutCookie);
      const destroyCookieHeader = destroyHeaders.get('Set-Cookie');

      // Assert the destroy header is correct, even if no cookie existed
      expect(destroyCookieHeader).toBeTruthy();
      expect(destroyCookieHeader).toContain('__email_invite_info=;');
      expect(destroyCookieHeader).toMatch(/Max-Age=0|Expires=.*1970/);
    });
  });
});
