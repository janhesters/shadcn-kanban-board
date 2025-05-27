import type { UserAccount } from '@prisma/client';

import {
  logout,
  requireUserIsAuthenticated,
} from '../user-authentication/user-authentication-helpers.server';
import {
  retrieveUserAccountFromDatabaseBySupabaseUserId,
  retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId,
  retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId,
} from './user-accounts-model.server';

/**
 * Ensures that a user account is present.
 *
 * @param userAccount - The user account to check - possibly null or undefined.
 * @returns The same user account if it exists.
 * @throws Logs the user out if the user account is missing.
 */
export const throwIfUserAccountIsMissing = async <T extends UserAccount>(
  request: Request,
  userAccount: T | null,
) => {
  if (!userAccount) {
    throw await logout(request, '/login');
  }

  return userAccount;
};

/**
 * Ensures that a user account for the authenticated user exists.
 *
 * @param request - The incoming request object.
 * @returns The user account.
 * @throws Logs the user out if the user account is missing.
 */
export const requireAuthenticatedUserExists = async (request: Request) => {
  const {
    user: { id },
    headers,
  } = await requireUserIsAuthenticated(request);
  const user = await retrieveUserAccountFromDatabaseBySupabaseUserId(id);
  return { user: await throwIfUserAccountIsMissing(request, user), headers };
};

/**
 * Ensures that a user account for the authenticated user exists and also
 * returns their memberships.
 *
 * IMPORTANT: This function does not check if the user is an active member of
 * the current slug in the URL! For that use `requireUserIsMemberOfOrganization`
 * instead.
 *
 * @param request - The incoming request object.
 * @returns The user account and their memberships.
 */
export const requireAuthenticatedUserWithMembershipsExists = async (
  request: Request,
) => {
  const {
    user: { id },
    headers,
    supabase,
  } = await requireUserIsAuthenticated(request);
  const user =
    await retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId(
      id,
    );
  return {
    user: await throwIfUserAccountIsMissing(request, user),
    headers,
    supabase,
  };
};

/**
 * Ensures that a user account for the authenticated user exists and also
 * returns their memberships and subscriptions.
 *
 * IMPORTANT: This function does not check if the user is an active member of
 * the current slug in the URL! For that use `requireUserIsMemberOfOrganization`
 * instead.
 *
 * @param request - The incoming request object.
 * @returns The user account and their memberships and subscriptions.
 */
export const requireAuthenticatedUserWithMembershipsAndSubscriptionsExists =
  async (request: Request) => {
    const {
      user: { id },
      headers,
      supabase,
    } = await requireUserIsAuthenticated(request);
    const user =
      await retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId(
        id,
      );
    return {
      user: await throwIfUserAccountIsMissing(request, user),
      headers,
      supabase,
    };
  };

/**
 * Ensures that a user account for the provided supabase user id exists.
 *
 * @param request - The incoming request object.
 * @param id - The supabase user id.
 * @returns The user account.
 */
export async function requireSupabaseUserExists(request: Request, id: string) {
  const user = await retrieveUserAccountFromDatabaseBySupabaseUserId(id);
  return await throwIfUserAccountIsMissing(request, user);
}
