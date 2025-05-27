import { asyncPipe } from '~/utils/async-pipe.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';
import { notFound } from '~/utils/http-responses.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';

import { retrieveActiveEmailInviteLinkFromDatabaseByToken } from '../organizations-email-invite-link-model.server';
import {
  destroyEmailInviteInfoSession,
  getEmailInviteInfoFromSession,
} from './accept-email-invite-session.server';

/**
 * Checks if the provided email invite has expired.
 *
 * @param invite - The email invite object retrieved from the database.
 * @throws A '404 Not Found' HTTP response if the email invite has expired.
 */
export const throwIfEmailInviteIsExpired = (
  invite: NonNullable<
    Awaited<ReturnType<typeof retrieveActiveEmailInviteLinkFromDatabaseByToken>>
  >,
) => {
  if (!invite || !invite.expiresAt || new Date() > invite.expiresAt) {
    throw notFound();
  }

  return invite;
};

/**
 * Retrieves the email invite token from the request URL.
 *
 * @param request - The request to get the token from.
 * @returns The token if found, otherwise undefined.
 */
export const getEmailInviteToken = getSearchParameterFromRequest('token');

/**
 * Validates and returns the organization email invite identified by the provided
 * token.
 *
 * @param token - The unique token identifying the email invite.
 * @returns A Promise that resolves with the email invite object if it exists and
 * has not expired.
 * @throws A '404 Not Found' error if the email invite does not exist in the
 * database or is expired.
 */
export const requireEmailInviteByTokenExists = asyncPipe(
  retrieveActiveEmailInviteLinkFromDatabaseByToken,
  throwIfEntityIsMissing,
  throwIfEmailInviteIsExpired,
);

/**
 * Ensures that an email invite identified by the provided token exists in the
 * database and returns the necessary data for the page.
 *
 * @param token - The unique token for the email invite.
 * @returns An object containing inviter and organization data associated with
 * the token.
 * @throws A '404 not found' HTTP response if the email invite identified by the
 * token doesn't exist or is expired.
 */
export async function requireEmailInviteDataByTokenExists(token: string) {
  const emailInvite = await requireEmailInviteByTokenExists(token);
  return {
    inviterName: emailInvite.invitedBy?.name ?? 'Deactivated User',
    organizationName: emailInvite.organization.name,
  };
}

/**
 * Retrieves the email invite information from the session and validates it.
 * If the email invite is expired or deactivated, it will be destroyed from the
 * session and the headers will be returned.
 *
 * @param request - The request to get the email invite information from.
 * @returns An object containing the headers and the email invite information.
 */
export async function getValidEmailInviteInfo(request: Request) {
  const tokenInfo = await getEmailInviteInfoFromSession(request);

  if (tokenInfo) {
    const emailInvite = await retrieveActiveEmailInviteLinkFromDatabaseByToken(
      tokenInfo.emailInviteToken,
    );

    if (emailInvite && emailInvite.organization) {
      return {
        headers: new Headers(),
        emailInviteInfo: {
          inviterName: emailInvite.invitedBy?.name ?? 'Deactivated User',
          organizationId: emailInvite.organization.id,
          organizationName: emailInvite.organization.name,
          organizationSlug: emailInvite.organization.slug,
          emailInviteId: emailInvite.id,
          emailInviteToken: emailInvite.token,
          role: emailInvite.role,
        },
      };
    }

    const headers = await destroyEmailInviteInfoSession(request);
    return { headers, emailInviteInfo: undefined };
  }

  return { headers: new Headers(), emailInviteInfo: undefined };
}
