import { href } from 'react-router';
import { z } from 'zod';

import { requireSupabaseUserExists } from '~/features/user-accounts/user-accounts-helpers.server';
import { createSupabaseServerClient } from '~/features/user-authentication/supabase.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getErrorMessage } from '~/utils/get-error-message';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { badRequest } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { createToastHeaders, redirectWithToast } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { acceptInviteLink } from '../organizations-helpers.server';
import { retrieveActiveInviteLinkFromDatabaseByToken } from '../organizations-invite-link-model.server';
import { ACCEPT_INVITE_LINK_INTENT } from './accept-invite-link-constants';
import { getInviteLinkToken } from './accept-invite-link-helpers.server';
import { createInviteLinkInfoHeaders } from './accept-invite-link-session.server';
import type { Route } from '.react-router/types/app/routes/organizations_+/+types/invite-link';

const acceptInviteLinkSchema = z.object({
  intent: z.literal(ACCEPT_INVITE_LINK_INTENT),
});

export async function acceptInviteLinkAction({ request }: Route.ActionArgs) {
  try {
    const t = await i18next.getFixedT(request, 'organizations', {
      keyPrefix: 'accept-invite-link',
    });
    const data = await validateFormData(request, acceptInviteLinkSchema);

    switch (data.intent) {
      case ACCEPT_INVITE_LINK_INTENT: {
        const { supabase, headers } = createSupabaseServerClient({ request });
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const token = getInviteLinkToken(request);
        const link = await retrieveActiveInviteLinkFromDatabaseByToken(token);

        if (!link) {
          const toastHeaders = await createToastHeaders({
            title: t('invite-link-invalid-toast-title'),
            description: t('invite-link-invalid-toast-description'),
            type: 'error',
          });

          return badRequest(
            { error: 'Invalid token' },
            { headers: combineHeaders(headers, toastHeaders) },
          );
        }

        if (user) {
          const userAccount = await requireSupabaseUserExists(request, user.id);

          try {
            await acceptInviteLink({
              inviteLinkId: link.id,
              inviteLinkToken: link.token,
              organizationId: link.organization.id,
              request,
              userAccountId: userAccount.id,
            });

            return redirectWithToast(
              href('/organizations/:organizationSlug/dashboard', {
                organizationSlug: link.organization.slug,
              }),
              {
                title: t('join-success-toast-title'),
                description: t('join-success-toast-description', {
                  organizationName: link.organization.name,
                }),
                type: 'success',
              },
              { headers },
            );
          } catch (error) {
            const message = getErrorMessage(error);

            if (
              message.includes(
                'Unique constraint failed on the fields: (`memberId`,`organizationId`)',
              ) ||
              message.includes(
                'Unique constraint failed on the fields: (`userId`,`organizationId`)',
              )
            ) {
              return await redirectWithToast(
                href('/organizations/:organizationSlug/dashboard', {
                  organizationSlug: link.organization.slug,
                }),
                {
                  title: t('already-member-toast-title'),
                  description: t('already-member-toast-description', {
                    organizationName: link.organization.name,
                  }),
                  type: 'info',
                },
                { headers },
              );
            }

            throw error;
          }
        }

        const inviteLinkInfo = await createInviteLinkInfoHeaders({
          inviteLinkToken: link.token,
          expiresAt: link.expiresAt,
        });
        return redirectWithToast(
          href('/register'),
          {
            title: t('invite-link-valid-toast-title'),
            description: t('invite-link-valid-toast-description'),
            type: 'info',
          },
          { headers: combineHeaders(headers, inviteLinkInfo) },
        );
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
