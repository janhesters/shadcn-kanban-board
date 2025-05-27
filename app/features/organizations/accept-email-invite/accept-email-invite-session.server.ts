import type { OrganizationEmailInviteLink } from '@prisma/client';
import { createCookieSessionStorage } from 'react-router';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { EMAIL_INVITE_INFO_SESSION_NAME } from './accept-email-invite-constants';

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set');

// Define keys for the session data
const EMAIL_INVITE_TOKEN_KEY = 'emailInviteToken'; // This is the token NOT the id

const emailInviteSchema = z.object({
  [EMAIL_INVITE_TOKEN_KEY]: z.string(),
});

export type EmailInviteInfoSessionData = z.infer<typeof emailInviteSchema>;

// Create the session storage instance
// Note: We don't set a default maxAge here; it will be set dynamically
// based on the email invite's expiration when committing the session.
const { commitSession, getSession, destroySession } =
  createCookieSessionStorage<EmailInviteInfoSessionData>({
    cookie: {
      name: EMAIL_INVITE_INFO_SESSION_NAME,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      secrets: [process.env.SESSION_SECRET],
    },
  });

export type CreateEmailInviteInfoCookieParams = EmailInviteInfoSessionData & {
  expiresAt: OrganizationEmailInviteLink['expiresAt'];
};

/**
 * Creates a cookie header for the email invite info session.
 *
 * @param emailInviteInfo - The email invite data to store in the session.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to persist the email invite info session.
 */
export async function createEmailInviteInfoCookie(
  emailInviteInfo: CreateEmailInviteInfoCookieParams,
) {
  const session = await getSession();
  const now = Date.now();
  const expiresAtTime = emailInviteInfo.expiresAt.getTime();

  if (expiresAtTime <= now) {
    // This shouldn't happen if using retrieveActiveEmailInviteFromDatabaseByToken,
    // but it's good defensive programming.
    console.warn(
      `Attempted to create email invite session cookie for already expired invite with token: ${emailInviteInfo.emailInviteToken}`,
    );
    // Return a header that immediately expires the cookie if it existed
    const cookieHeader = await destroySession(session);
    return cookieHeader;
  }

  // Calculate remaining time in seconds
  const maxAgeInSeconds = Math.floor((expiresAtTime - now) / 1000);
  session.set(EMAIL_INVITE_TOKEN_KEY, emailInviteInfo.emailInviteToken);
  return await commitSession(session, {
    maxAge: maxAgeInSeconds,
  });
}

/**
 * Creates HTTP headers containing a 'Set-Cookie' directive to store
 * email invite information in the user's session.
 *
 * @param emailInviteInfo - The email invite data to store in the session.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to persist the email invite info session.
 */
export async function createEmailInviteInfoHeaders(
  emailInviteInfo: CreateEmailInviteInfoCookieParams,
) {
  return new Headers({
    'Set-Cookie': await createEmailInviteInfoCookie(emailInviteInfo),
  });
}

/**
 * Retrieves and validates email invite information from the session cookie
 * present in the incoming request.
 *
 * @param request - The incoming `Request` object, potentially containing the
 * email invite info session cookie.
 * @returns A promise that resolves to the validated `EmailInviteInfoSessionData`
 * if found and valid, otherwise resolves to `undefined`.
 */
export async function getEmailInviteInfoFromSession(
  request: Request,
): Promise<EmailInviteInfoSessionData | undefined> {
  const session = await getSession(request.headers.get('Cookie'));
  const emailInviteToken = session.get(EMAIL_INVITE_TOKEN_KEY);

  // Attempt to parse the retrieved data against the schema
  const result = emailInviteSchema.safeParse({ emailInviteToken });

  // Return the parsed data if successful, otherwise undefined
  return result.success ? result.data : undefined;
}

/**
 * Creates HTTP headers containing a 'Set-Cookie' directive to destroy
 * the email invite information session cookie.
 *
 * @param request - The incoming `Request` object used to retrieve the current
 * session cookie details for destruction.
 * @returns A `Headers` object with the 'Set-Cookie' header necessary
 * to remove the email invite info session cookie.
 */
export async function destroyEmailInviteInfoSession(
  request: Request,
): Promise<Headers> {
  const session = await getSession(request.headers.get('Cookie'));
  return new Headers({ 'Set-Cookie': await destroySession(session) });
}
