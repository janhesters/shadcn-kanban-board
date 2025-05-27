import { href, redirect } from 'react-router';

import { getValidEmailInviteInfo } from '~/features/organizations/accept-email-invite/accept-email-invite-helpers.server';
import { destroyEmailInviteInfoSession } from '~/features/organizations/accept-email-invite/accept-email-invite-session.server';
import { getValidInviteLinkInfo } from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { destroyInviteLinkInfoSession } from '~/features/organizations/accept-invite-link/accept-invite-link-session.server';
import {
  acceptEmailInvite,
  acceptInviteLink,
} from '~/features/organizations/organizations-helpers.server';
import { saveUserAccountToDatabase } from '~/features/user-accounts/user-accounts-model.server';
import { retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail } from '~/features/user-accounts/user-accounts-model.server';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';
import i18next from '~/utils/i18next.server';
import { redirectWithToast } from '~/utils/toast.server';

import type { Route } from './+types/register.confirm';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = await requireUserIsAnonymous(request);
  const { inviteLinkInfo, headers: inviteLinkHeaders } =
    await getValidInviteLinkInfo(request);
  const { emailInviteInfo, headers: emailInviteHeaders } =
    await getValidEmailInviteInfo(request);

  const tokenHash = getSearchParameterFromRequest('token_hash')(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (error) {
    throw error;
  }

  if (!user?.email || !user.id) {
    throw new Error('User not found');
  }

  // If the user for some reason did NOT click the link from the register route
  // and they try to sign up again, they will instead get here because Supabase
  // will already have created a user (with an unconfirmed email).
  // So we need to check if the user already exists in the database and if not,
  // we need to create a new user account.
  const userAccount =
    await retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(
      user.email,
    );

  const finalUserAccount =
    userAccount ??
    (await saveUserAccountToDatabase({
      email: user.email,
      supabaseUserId: user.id,
    }));

  if (inviteLinkInfo || emailInviteInfo) {
    const t = await i18next.getFixedT(request, 'organizations', {
      keyPrefix: 'accept-invite-link',
    });
    const organizationId =
      inviteLinkInfo?.organizationId ?? emailInviteInfo!.organizationId;
    const organizationSlug =
      inviteLinkInfo?.organizationSlug ?? emailInviteInfo!.organizationSlug;
    const organizationName =
      inviteLinkInfo?.organizationName ?? emailInviteInfo!.organizationName;

    // If the user is already a member of the organization, redirect to
    // the organization dashboard and show a toast.
    if (
      userAccount?.memberships.some(m => m.organizationId === organizationId)
    ) {
      return redirectWithToast(
        href('/organizations/:organizationSlug/dashboard', {
          organizationSlug,
        }),
        {
          title: t('already-member-toast-title'),
          description: t('already-member-toast-description', {
            organizationName,
          }),
          type: 'info',
        },
        {
          headers: combineHeaders(
            headers,
            await destroyEmailInviteInfoSession(request),
            await destroyInviteLinkInfoSession(request),
          ),
        },
      );
    }

    if (emailInviteInfo) {
      await acceptEmailInvite({
        // If the user already has a name, we deactivate the email invite link,
        // otherwise this will be done during onboarding.
        // eslint-disable-next-line unicorn/no-null
        deactivatedAt: userAccount?.name ? new Date() : null,
        emailInviteId: emailInviteInfo.emailInviteId,
        emailInviteToken: emailInviteInfo.emailInviteToken,
        organizationId: emailInviteInfo.organizationId,
        request,
        role: emailInviteInfo.role,
        userAccountId: finalUserAccount.id,
      });

      // If the user has a name, they're already onboarded and we can redirect
      // them to their new organization's dashboard.
      return userAccount?.name
        ? redirectWithToast(
            href('/organizations/:organizationSlug/dashboard', {
              organizationSlug: emailInviteInfo.organizationSlug,
            }),
            {
              title: t('join-success-toast-title'),
              description: t('join-success-toast-description', {
                organizationName: emailInviteInfo.organizationName,
              }),
              type: 'success',
            },
            {
              headers: combineHeaders(
                headers,
                inviteLinkHeaders,
                await destroyEmailInviteInfoSession(request),
              ),
            },
          )
        : // Otherwise, they're new and we need to send them to the onboarding
          // flow.
          redirect(href('/onboarding/user-account'), { headers });
    } else if (inviteLinkInfo) {
      await acceptInviteLink({
        inviteLinkId: inviteLinkInfo.inviteLinkId,
        inviteLinkToken: inviteLinkInfo.inviteLinkToken,
        organizationId: inviteLinkInfo.organizationId,
        request,
        userAccountId: finalUserAccount.id,
      });

      // If the user has a name, they're already onboarded and we can redirect
      // them to their new organization's dashboard.
      return userAccount?.name
        ? redirectWithToast(
            href('/organizations/:organizationSlug/dashboard', {
              organizationSlug: inviteLinkInfo.organizationSlug,
            }),
            {
              title: t('join-success-toast-title'),
              description: t('join-success-toast-description', {
                organizationName: inviteLinkInfo.organizationName,
              }),
              type: 'success',
            },
            {
              headers: combineHeaders(
                headers,
                emailInviteHeaders,
                await destroyInviteLinkInfoSession(request),
              ),
            },
          )
        : // Otherwise, they're new and we need to send them to the onboarding
          // flow.
          redirect(href('/onboarding/user-account'), { headers });
    }
  }

  return redirect(href('/organizations'), {
    headers: combineHeaders(headers, inviteLinkHeaders, emailInviteHeaders),
  });
}
