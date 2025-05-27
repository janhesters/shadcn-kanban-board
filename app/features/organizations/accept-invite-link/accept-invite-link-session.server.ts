import type { OrganizationInviteLink } from '@prisma/client';
import { createCookieSessionStorage } from 'react-router';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { INVITE_LINK_INFO_SESSION_NAME } from './accept-invite-link-constants';

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set');

// Define keys for the session data
const INVITE_LINK_TOKEN_KEY = 'inviteLinkToken'; // This is the token NOT the id

const inviteLinkSchema = z.object({
  [INVITE_LINK_TOKEN_KEY]: z.string(),
});

export type InviteLinkInfoSessionData = z.infer<typeof inviteLinkSchema>;

// Create the session storage instance
// Note: We don't set a default maxAge here; it will be set dynamically
// based on the invite link's expiration when committing the session.
const { commitSession, getSession, destroySession } =
  createCookieSessionStorage<InviteLinkInfoSessionData>({
    cookie: {
      name: INVITE_LINK_INFO_SESSION_NAME,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      secrets: [process.env.SESSION_SECRET],
    },
  });

export type CreateInviteLinkInfoCookieParams = InviteLinkInfoSessionData & {
  expiresAt: OrganizationInviteLink['expiresAt'];
};

/**
 * Creates a cookie header for the invite link info session.
 *
 * @param inviteLinkInfo - The invite link data to store in the session.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to persist the invite link info session.
 */
export async function createInviteLinkInfoCookie(
  inviteLinkInfo: CreateInviteLinkInfoCookieParams,
) {
  const session = await getSession();
  const now = Date.now();
  const expiresAtTime = inviteLinkInfo.expiresAt.getTime();

  if (expiresAtTime <= now) {
    // This shouldn't happen if using retrieveActiveInviteLinkFromDatabaseByToken,
    // but it's good defensive programming.
    console.warn(
      `Attempted to create invite link session cookie for already expired link with token: ${inviteLinkInfo.inviteLinkToken}`,
    );
    // Return a header that immediately expires the cookie if it existed
    const cookieHeader = await destroySession(session);
    return cookieHeader;
  }

  // Calculate remaining time in seconds
  const maxAgeInSeconds = Math.floor((expiresAtTime - now) / 1000);
  session.set(INVITE_LINK_TOKEN_KEY, inviteLinkInfo.inviteLinkToken);
  return await commitSession(session, {
    maxAge: maxAgeInSeconds,
  });
}

/**
 * Creates HTTP headers containing a 'Set-Cookie' directive to store
 * invite link information in the user's session.
 *
 * @param inviteLinkInfo - The invite link data to store in the session.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to persist the invite link info session.
 */
export async function createInviteLinkInfoHeaders(
  inviteLinkInfo: CreateInviteLinkInfoCookieParams,
) {
  return new Headers({
    'Set-Cookie': await createInviteLinkInfoCookie(inviteLinkInfo),
  });
}

/**
 * Retrieves and validates invite link information from the session cookie
 * present in the incoming request.
 *
 * @param request - The incoming `Request` object, potentially containing the
 * invite link info session cookie.
 * @returns A promise that resolves to the validated `InviteLinkInfoSessionData`
 * if found and valid, otherwise resolves to `undefined`.
 */
export async function getInviteLinkInfoFromSession(
  request: Request,
): Promise<InviteLinkInfoSessionData | undefined> {
  const session = await getSession(request.headers.get('Cookie'));
  const inviteLinkToken = session.get(INVITE_LINK_TOKEN_KEY);

  // Attempt to parse the retrieved data against the schema
  const result = inviteLinkSchema.safeParse({ inviteLinkToken });

  // Return the parsed data if successful, otherwise undefined
  return result.success ? result.data : undefined;
}

/**
 * Creates HTTP headers containing a 'Set-Cookie' directive to destroy
 * the invite link information session cookie.
 *
 * @param request - The incoming `Request` object used to retrieve the current
 * session cookie details for destruction.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to remove the invite link info session cookie.
 */
export async function destroyInviteLinkInfoSession(
  request: Request,
): Promise<Headers> {
  const session = await getSession(request.headers.get('Cookie'));
  return new Headers({ 'Set-Cookie': await destroySession(session) });
}
