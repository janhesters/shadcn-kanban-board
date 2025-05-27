import type { Session } from '@supabase/supabase-js';

import { prisma } from '~/utils/database.server';

/**
 * Type guard to check if an unknown value is a valid Supabase Session object.
 *
 * @param data - The unknown value to check
 * @returns True if the value is a valid Session object, false otherwise
 */
function isSession(data: unknown): data is Session {
  return (
    data != undefined &&
    typeof data === 'object' &&
    'access_token' in data &&
    'refresh_token' in data &&
    'expires_in' in data &&
    'token_type' in data &&
    'user' in data
  );
}

/**
 * Sets or updates a mock session in the database for a given access token.
 *
 * @param accessToken - The access token to associate with the session
 * @param session - The Supabase session data to store
 * @returns A promise that resolves when the session is saved
 */
export async function setMockSession(accessToken: string, session: Session) {
  await prisma.mockAccessTokenSession.upsert({
    where: { accessToken },
    update: { sessionData: session },
    create: { accessToken, sessionData: session },
  });
}

/**
 * Retrieves a mock session from the database for a given access token.
 *
 * @param accessToken - The access token to look up
 * @returns A promise that resolves to the stored session data or null if not
 * found
 * @throws {Error} If the stored session data is invalid
 */
export async function getMockSession(
  accessToken: string,
): Promise<Session | null> {
  const result = await prisma.mockAccessTokenSession.findUnique({
    where: { accessToken },
  });

  if (!result) {
    return result;
  }

  const sessionData = result.sessionData;
  if (!isSession(sessionData)) {
    throw new Error(`Invalid session data for accessToken: ${accessToken}`, {
      cause: sessionData,
    });
  }

  return sessionData;
}

/**
 * Deletes a mock session from the database for a given access token.
 *
 * @param accessToken - The access token whose session should be deleted
 * @returns A promise that resolves when the session is deleted
 */
export async function deleteMockSession(accessToken: string) {
  await prisma.mockAccessTokenSession.delete({
    where: { accessToken },
  });
}

/**
 * Removes all mock sessions from the database.
 *
 * @returns A promise that resolves when all sessions are deleted
 */
export async function clearMockSessions() {
  await prisma.mockAccessTokenSession.deleteMany({});
}
