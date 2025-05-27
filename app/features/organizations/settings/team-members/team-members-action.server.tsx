import { createId } from '@paralleldrive/cuid2';
import type { Prisma } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { addDays } from 'date-fns';
import { data } from 'react-router';
import { promiseHash } from 'remix-utils/promise';
import { z } from 'zod';

import { adjustSeats } from '~/features/billing/stripe-helpers.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { sendEmail } from '~/utils/email.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { badRequest, created, forbidden } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { createToastHeaders } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import {
  retrieveActiveOrganizationMembershipByEmailAndOrganizationId,
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
  updateOrganizationMembershipInDatabase,
} from '../../organization-membership-model.server';
import { saveOrganizationEmailInviteLinkToDatabase } from '../../organizations-email-invite-link-model.server';
import {
  getOrganizationIsFull,
  requireUserIsMemberOfOrganization,
} from '../../organizations-helpers.server';
import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  saveOrganizationInviteLinkToDatabase,
  updateOrganizationInviteLinkInDatabaseById,
} from '../../organizations-invite-link-model.server';
import { InviteEmail } from './invite-email';
import {
  CHANGE_ROLE_INTENT,
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from './team-members-constants';
import {
  changeRoleSchema,
  inviteByEmailSchema,
} from './team-members-settings-schemas';
import type { Route } from '.react-router/types/app/routes/organizations_+/$organizationSlug+/settings+/+types/members';

const schema = z.discriminatedUnion('intent', [
  inviteByEmailSchema,
  z.object({ intent: z.literal(CREATE_NEW_INVITE_LINK_INTENT) }),
  z.object({ intent: z.literal(DEACTIVATE_INVITE_LINK_INTENT) }),
  changeRoleSchema,
]);

export async function teamMembersAction({ request, params }: Route.ActionArgs) {
  try {
    const { user, organization, role, headers } =
      await requireUserIsMemberOfOrganization(request, params.organizationSlug);

    if (role === OrganizationMembershipRole.member) {
      throw forbidden();
    }

    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case CREATE_NEW_INVITE_LINK_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            errors: {
              email: {
                message:
                  'organizations:settings.team-members.invite-by-email.form.organization-full',
              },
            },
          });
        }

        // Deactivate any existing active invite link
        const latestInviteLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );

        if (latestInviteLink) {
          await updateOrganizationInviteLinkInDatabaseById({
            id: latestInviteLink.id,
            organizationInviteLink: { deactivatedAt: new Date() },
          });
        }

        // Create a new invite link that expires in 2 days
        const token = createId();
        const expiresAt = addDays(new Date(), 2);
        await saveOrganizationInviteLinkToDatabase({
          token,
          expiresAt,
          creatorId: user.id,
          organizationId: organization.id,
        });

        return created({}, { headers });
      }

      case DEACTIVATE_INVITE_LINK_INTENT: {
        const latestInviteLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );

        if (latestInviteLink) {
          await updateOrganizationInviteLinkInDatabaseById({
            id: latestInviteLink.id,
            organizationInviteLink: { deactivatedAt: new Date() },
          });
        }

        return created({}, { headers });
      }

      case CHANGE_ROLE_INTENT: {
        const { userId: targetUserId, role: requestedRoleOrStatus } = body;

        // Prevent users from changing their own role/status
        if (targetUserId === user.id) {
          throw forbidden({
            errors: { form: 'You cannot change your own role or status.' },
          });
        }

        // Retrieve the target member's current membership details
        const targetMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            {
              userId: targetUserId,
              organizationId: organization.id,
            },
          );

        // Handle case where target user isn't found in this org
        if (!targetMembership) {
          throw badRequest({
            errors: {
              userId: 'Target user is not a member of this organization.',
            },
          });
        }

        // Apply role-based permissions (requesting user's role = 'role')
        if (role === OrganizationMembershipRole.admin) {
          // Admins cannot modify Owners
          if (targetMembership.role === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: 'Administrators cannot modify the role or status of owners.',
              },
            });
          }

          // Admins also cannot promote others to Owner
          if (requestedRoleOrStatus === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: 'Administrators cannot promote members to the owner role.',
              },
            });
          }
        }
        // Owners have full permissions (already checked for self-modification)

        /// Get the subscription of the organization, if it exists.
        const subscription = organization.stripeSubscriptions[0];
        // Prepare the data for the database update
        let updateData: Prisma.OrganizationMembershipUpdateInput;
        if (requestedRoleOrStatus === 'deactivated') {
          // Set deactivatedAt timestamp
          updateData = { deactivatedAt: new Date() };

          if (subscription) {
            await adjustSeats({
              subscriptionId: subscription.stripeId,
              subscriptionItemId: subscription.items[0].stripeId,
              newQuantity: organization._count.memberships - 1,
            });
          }
        } else {
          // Update role and ensure deactivatedAt is null
          // `requestedRoleOrStatus` here is guaranteed by zod schema to be
          // 'member', 'admin', or 'owner'
          const newRole = requestedRoleOrStatus;
          // eslint-disable-next-line unicorn/no-null
          updateData = { role: newRole, deactivatedAt: null };

          // If the user was deactivated, and there is a subscription,
          // they will now take up a seat again.
          if (targetMembership.deactivatedAt) {
            if (getOrganizationIsFull(organization)) {
              const t = await i18next.getFixedT(request, 'organizations', {
                keyPrefix:
                  'organizations:settings.team-members.invite-by-email',
              });
              const toastHeaders = await createToastHeaders({
                title: t('organization-full-toast-title'),
                description: t('organization-full-toast-description'),
                type: 'error',
              });
              return badRequest(
                {
                  errors: {
                    email: {
                      message:
                        'organizations:settings.team-members.invite-by-email.form.organization-full',
                    },
                  },
                },
                { headers: combineHeaders(headers, toastHeaders) },
              );
            }

            if (subscription) {
              await adjustSeats({
                subscriptionId: subscription.stripeId,
                subscriptionItemId: subscription.items[0].stripeId,
                newQuantity: organization._count.memberships + 1,
              });
            }
          }
        }

        // Perform the database update
        await updateOrganizationMembershipInDatabase({
          userId: targetUserId,
          organizationId: organization.id,
          data: updateData,
        });

        // Return success
        return data({}, { headers });
      }

      case INVITE_BY_EMAIL_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            errors: {
              email: {
                message:
                  'organizations:settings.team-members.invite-by-email.form.organization-full',
              },
            },
          });
        }

        if (
          role !== OrganizationMembershipRole.owner &&
          body.role === OrganizationMembershipRole.owner
        ) {
          return forbidden({
            errors: {
              message: 'Only organization owners can invite as owners.',
            },
          });
        }

        const { t, commonT } = await promiseHash({
          t: i18next.getFixedT(request, 'organizations', {
            keyPrefix: 'organizations:settings.team-members.invite-by-email',
          }),
          commonT: i18next.getFixedT(request, 'common'),
        });

        const existingMember =
          await retrieveActiveOrganizationMembershipByEmailAndOrganizationId({
            email: body.email,
            organizationId: organization.id,
          });

        if (existingMember) {
          return badRequest({
            errors: {
              email: {
                message: t('form.email-already-member', { email: body.email }),
              },
            },
          });
        }

        const emailInvite = await saveOrganizationEmailInviteLinkToDatabase({
          email: body.email,
          expiresAt: addDays(new Date(), 2),
          invitedById: user.id,
          organizationId: organization.id,
          role: body.role,
        });

        const joinUrl = `${process.env.APP_URL}/organizations/email-invite?token=${emailInvite.token}`;

        const result = await sendEmail({
          to: body.email,
          subject: t('invite-email.subject', {
            inviteName: user.name,
            appName: commonT('app-name'),
          }),
          react: (
            <InviteEmail
              title={t('invite-email.title', {
                appName: commonT('app-name'),
              })}
              description={t('invite-email.description', {
                appName: commonT('app-name'),
                inviterName: user.name,
                organizationName: organization.name,
              })}
              callToAction={t('invite-email.call-to-action')}
              buttonText={t('invite-email.button-text', {
                organizationName: organization.name,
              })}
              buttonUrl={joinUrl}
            />
          ),
        });

        if (result.status === 'error') {
          return badRequest({
            errors: { email: { message: result.error.message } },
          });
        }

        const toastHeaders = await createToastHeaders({
          title: t('success-toast-title'),
          type: 'success',
        });

        return data(
          { success: body.email },
          { headers: combineHeaders(headers, toastHeaders) },
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
