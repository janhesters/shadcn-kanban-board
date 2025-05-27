import { href, redirect } from 'react-router';

import { asyncPipe } from '~/utils/async-pipe.server';

import { throwIfUserAccountIsMissing } from '../user-accounts/user-accounts-helpers.server';
import { retrieveUserAccountWithMembershipsFromDatabaseBySupabaseUserId } from '../user-accounts/user-accounts-model.server';
import { requireUserIsAuthenticated } from '../user-authentication/user-authentication-helpers.server';

/**
 * Retrieves a user's account with their memberships from the database by their
 * supabase user id.
 *
 * @param request - A Request object.
 * @returns The user's account with their memberships.
 */
async function requireOnboardingUserExists(request: Request) {
  const {
    user: { id },
    headers,
  } = await requireUserIsAuthenticated(request);
  const user =
    await retrieveUserAccountWithMembershipsFromDatabaseBySupabaseUserId(id);
  return { user: await throwIfUserAccountIsMissing(request, user), headers };
}

/**
 * The user for the onboarding helper functions.
 */
export type OnboardingUser = Awaited<
  ReturnType<typeof requireOnboardingUserExists>
>['user'];

/**
 * The organization with memberships and subscriptions for the onboarding helper
 * functions.
 */
export type OrganizationWithMembershipsAndSubscriptions =
  OnboardingUser['memberships'][number]['organization'];

/**
 * Checks if the user is onboarded, which means they have a name and are a
 * member of at least one organization.
 *
 * @param user - The OnboardingUser object.
 * @returns `true` if the user is onboarded; otherwise, `false`.
 */
export const getUserIsOnboarded = (user: OnboardingUser) =>
  user.memberships.length > 0 && user.name.length > 0;

/**
 * Checks if the user is onboarded; if so, redirects the user to their first
 * organization.
 *
 * @param user - The OnboardingUser object.
 * @param headers - The Headers object containing the user's headers.
 * @returns The user object if not onboarded.
 * @throws Response with 302 status redirecting to the user's first organization
 * if the user is onboarded.
 */
export const throwIfUserIsOnboarded = (
  user: OnboardingUser,
  headers: Headers,
) => {
  if (getUserIsOnboarded(user)) {
    if (user.memberships.length === 1) {
      const slug = user.memberships[0].organization.slug;
      throw redirect(
        href('/organizations/:organizationSlug', {
          organizationSlug: slug,
        }),
        { headers },
      );
    }

    throw redirect(href('/organizations'), { headers });
  }

  return user;
};

/**
 * Redirects the user to the appropriate onboarding step based on their state.
 *
 * @param request - The Request object containing the user's request.
 * @param user - The user's account with their memberships.
 * @param headers - The Headers object containing the user's headers.
 * @returns A function that takes the user object and returns it if the user is
 * on the correct onboarding step; otherwise, throws a 302 redirect to the
 * appropriate step.
 */
export const redirectUserToOnboardingStep = (
  request: Request,
  user: OnboardingUser,
  headers: Headers,
) => {
  const { pathname } = new URL(request.url);

  if (user.name.length === 0 && pathname !== '/onboarding/user-account') {
    throw redirect(href('/onboarding/user-account'), { headers });
  }

  if (
    user.name.length > 0 &&
    user.memberships.length === 0 &&
    pathname !== '/onboarding/organization'
  ) {
    throw redirect(href('/onboarding/organization'), { headers });
  }

  return { user, headers };
};

/**
 * Ensures the user needs onboarding and redirects to the appropriate onboarding
 * step. If the user is onboarded, it navigates to their first organization.
 *
 * @param request - The request object containing the user's request.
 * @returns The user object if the user needs onboarding and is on the correct
 * step.
 * @throws A response with the appropriate error status or redirect based on the
 * user's onboarding status.
 */
export async function requireUserNeedsOnboarding(request: Request) {
  const { user, headers } = await requireOnboardingUserExists(request);
  return redirectUserToOnboardingStep(
    request,
    throwIfUserIsOnboarded(user, headers),
    headers,
  );
}

/**
 * Checks if the user is onboarded; if not, redirects the user to the onboarding
 * page.
 *
 * @param user - The OnboardingUser object.
 * @returns The user object if onboarded.
 */
export const throwIfUserNeedsOnboarding = ({
  user,
  headers,
}: {
  user: OnboardingUser;
  headers: Headers;
}) => {
  if (getUserIsOnboarded(user)) {
    return { user, headers };
  }

  throw redirect(href('/onboarding'), { headers });
};

/**
 * Returns a user account with their active organization memberships for a given
 * user id and request.
 *
 * @param request - A Request object.
 * @returns A user's account with their organization memberships.
 * @throws A redirect to the login page if the user does NOT exist.
 * @throws A redirect to the onboarding page if the user needs onboarding.
 */
export const requireOnboardedUserAccountExists = asyncPipe(
  requireOnboardingUserExists,
  throwIfUserNeedsOnboarding,
);
