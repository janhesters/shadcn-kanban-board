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

import {
  retrieveActiveEmailInviteLinkFromDatabaseByToken,
  updateEmailInviteLinkInDatabaseById,
} from '../organizations-email-invite-link-model.server';
import { acceptEmailInvite } from '../organizations-helpers.server';
import { ACCEPT_EMAIL_INVITE_INTENT } from './accept-email-invite-constants';
import { getEmailInviteToken } from './accept-email-invite-helpers.server';
import { createEmailInviteInfoHeaders } from './accept-email-invite-session.server';
import type { Route } from '.react-router/types/app/routes/organizations_+/+types/email-invite';

const acceptEmailInviteSchema = z.object({
  intent: z.literal(ACCEPT_EMAIL_INVITE_INTENT),
});

export async function acceptEmailInviteAction({ request }: Route.ActionArgs) {
  try {
    const t = await i18next.getFixedT(request, 'organizations', {
      keyPrefix: 'accept-email-invite',
    });
    const data = await validateFormData(request, acceptEmailInviteSchema);

    switch (data.intent) {
      case ACCEPT_EMAIL_INVITE_INTENT: {
        const { supabase, headers } = createSupabaseServerClient({ request });
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const token = getEmailInviteToken(request);

        if (!token) {
          const toastHeaders = await createToastHeaders({
            title: t('invite-email-invalid-toast-title'),
            description: t('invite-email-invalid-toast-description'),
            type: 'error',
          });

          return badRequest(
            { error: 'Invalid token' },
            { headers: combineHeaders(headers, toastHeaders) },
          );
        }

        const link =
          await retrieveActiveEmailInviteLinkFromDatabaseByToken(token);

        if (!link) {
          const toastHeaders = await createToastHeaders({
            title: t('invite-email-invalid-toast-title'),
            description: t('invite-email-invalid-toast-description'),
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
            await acceptEmailInvite({
              emailInviteId: link.id,
              emailInviteToken: link.token,
              organizationId: link.organization.id,
              request,
              role: link.role,
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
              await updateEmailInviteLinkInDatabaseById({
                id: link.id,
                emailInviteLink: { deactivatedAt: new Date() },
              });
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

        const emailInviteInfo = await createEmailInviteInfoHeaders({
          emailInviteToken: link.token,
          expiresAt: link.expiresAt,
        });

        return redirectWithToast(
          href('/register'),
          {
            title: t('invite-email-valid-toast-title'),
            description: t('invite-email-valid-toast-description'),
            type: 'info',
          },
          { headers: combineHeaders(headers, emailInviteInfo) },
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
