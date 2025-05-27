import type {
  Organization,
  OrganizationEmailInviteLink,
  OrganizationInviteLink,
  UserAccount,
} from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { href } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { combineHeaders } from '~/utils/combine-headers.server';
import { notFound } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { removeImageFromStorage } from '~/utils/storage-helpers.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';
import { redirectWithToast } from '~/utils/toast.server';

import {
  adjustSeats,
  deactivateStripeCustomer,
} from '../billing/stripe-helpers.server';
import type {
  OnboardingUser,
  OrganizationWithMembershipsAndSubscriptions,
} from '../onboarding/onboarding-helpers.server';
import { requireOnboardedUserAccountExists } from '../onboarding/onboarding-helpers.server';
import { getValidEmailInviteInfo } from './accept-email-invite/accept-email-invite-helpers.server';
import { destroyEmailInviteInfoSession } from './accept-email-invite/accept-email-invite-session.server';
import { getValidInviteLinkInfo } from './accept-invite-link/accept-invite-link-helpers.server';
import { destroyInviteLinkInfoSession } from './accept-invite-link/accept-invite-link-session.server';
import { saveInviteLinkUseToDatabase } from './accept-invite-link/invite-link-use-model.server';
import { updateEmailInviteLinkInDatabaseById } from './organizations-email-invite-link-model.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId,
  retrieveOrganizationWithSubscriptionsFromDatabaseById,
} from './organizations-model.server';

/**
 * Finds an organization by ID if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationId - The ID of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberById<User extends OnboardingUser>(
  user: User,
  organizationId: Organization['id'],
) {
  const membership = user.memberships.find(
    membership => membership.organization.id === organizationId,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Finds an organization by slug if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationSlug - The slug of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberBySlug<
  User extends OnboardingUser,
>(user: User, organizationSlug: Organization['slug']) {
  const membership = user.memberships.find(
    membership => membership.organization.slug === organizationSlug,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Requires that the authenticated user from the request is a member of the
 * specified organization.
 *
 * @param request - The incoming request.
 * @param organizationSlug - The slug of the organization to check membership
 * for.
 * @returns Object containing the user, organization and auth headers.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export async function requireUserIsMemberOfOrganization(
  request: Request,
  organizationSlug: Organization['slug'],
) {
  const { user, headers } = await requireOnboardedUserAccountExists(request);
  const { organization, role } = findOrganizationIfUserIsMemberBySlug(
    user,
    organizationSlug,
  );
  return { user, organization, role, headers };
}

/**
 * Deletes an organization and all associated subscriptions.
 *
 * @param organizationId - The ID of the organization to delete.
 */
export async function deleteOrganization(organizationId: Organization['id']) {
  const organization =
    await retrieveOrganizationWithSubscriptionsFromDatabaseById(organizationId);

  if (organization) {
    if (organization.stripeCustomerId) {
      await deactivateStripeCustomer(organization.stripeCustomerId);
    }

    await removeImageFromStorage(organization.imageUrl);

    await deleteOrganizationFromDatabaseById(organizationId);
  }
}

/**
 * Accepts an invite link and adds the user to the organization. Also adjusts
 * the number of seats on the organization's subscription if it exists.
 *
 * @param userAccountId - The ID of the user account to add to the organization.
 * @param organizationId - The ID of the organization to add the user to.
 * @param inviteLinkId - The ID of the invite link to accept.
 */
export async function acceptInviteLink({
  userAccountId,
  organizationId,
  inviteLinkId,
  inviteLinkToken,
  request,
}: {
  userAccountId: UserAccount['id'];
  organizationId: Organization['id'];
  inviteLinkId: OrganizationInviteLink['id'];
  inviteLinkToken: OrganizationInviteLink['token'];
  request: Request;
}) {
  const organization =
    await retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId(
      organizationId,
    );

  if (organization) {
    const subscription = organization.stripeSubscriptions[0];

    if (subscription) {
      const maxSeats = subscription.items[0]?.price.product.maxSeats ?? 25;

      if (organization._count.memberships >= maxSeats) {
        const t = await i18next.getFixedT(request, 'organizations', {
          keyPrefix: 'accept-invite-link',
        });
        throw await redirectWithToast(
          `${href('/organizations/invite-link')}?token=${inviteLinkToken}`,
          {
            title: t('organization-full-toast-title'),
            description: t('organization-full-toast-description'),
            type: 'error',
          },
          { headers: await destroyInviteLinkInfoSession(request) },
        );
      }
    }

    await addMembersToOrganizationInDatabaseById({
      id: organizationId,
      members: [userAccountId],
      role: OrganizationMembershipRole.member,
    });
    await saveInviteLinkUseToDatabase({
      inviteLinkId,
      userId: userAccountId,
    });

    if (subscription && subscription.status !== 'canceled') {
      await adjustSeats({
        subscriptionId: subscription.stripeId,
        subscriptionItemId: subscription.items[0].stripeId,
        newQuantity: organization._count.memberships + 1,
      });
    }
  }
}

/**
 * Accepts an email invite and adds the user to the organization. Also adjusts
 * the number of seats on the organization's subscription if it exists.
 *
 * @param userAccountId - The ID of the user account to add to the organization.
 * @param organizationId - The ID of the organization to add the user to.
 * @param inviteLinkId - The ID of the invite link to accept.
 */
export async function acceptEmailInvite({
  deactivatedAt = new Date(),
  emailInviteId,
  emailInviteToken,
  organizationId,
  request,
  role,
  userAccountId,
}: {
  deactivatedAt?: OrganizationEmailInviteLink['deactivatedAt'];
  emailInviteId: OrganizationEmailInviteLink['id'];
  emailInviteToken: OrganizationEmailInviteLink['token'];
  organizationId: Organization['id'];
  request: Request;
  role: OrganizationMembershipRole;
  userAccountId: UserAccount['id'];
}) {
  const organization =
    await retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId(
      organizationId,
    );

  if (organization) {
    const subscription = organization.stripeSubscriptions[0];

    if (subscription) {
      const maxSeats = subscription.items[0]?.price.product.maxSeats ?? 25;

      if (organization._count.memberships >= maxSeats) {
        const t = await i18next.getFixedT(request, 'organizations', {
          keyPrefix: 'accept-email-invite',
        });
        throw await redirectWithToast(
          `${href('/organizations/email-invite')}?token=${emailInviteToken}`,
          {
            title: t('organization-full-toast-title'),
            description: t('organization-full-toast-description'),
            type: 'error',
          },
          { headers: await destroyEmailInviteInfoSession(request) },
        );
      }
    }

    await addMembersToOrganizationInDatabaseById({
      id: organizationId,
      members: [userAccountId],
      role,
    });
    await updateEmailInviteLinkInDatabaseById({
      id: emailInviteId,
      emailInviteLink: { deactivatedAt },
    });

    if (subscription && subscription.status !== 'canceled') {
      await adjustSeats({
        subscriptionId: subscription.stripeId,
        subscriptionItemId: subscription.items[0].stripeId,
        newQuantity: organization._count.memberships + 1,
      });
    }
  }
}

/**
 * Checks if the organization is full.
 *
 * @param organization - The organization to check.
 * @returns `true` if the organization is full; otherwise, `false`.
 */
export const getOrganizationIsFull = (
  organization: OrganizationWithMembershipsAndSubscriptions,
) => {
  const currentSubscription = organization.stripeSubscriptions[0];
  const currentSubscriptionIsActive =
    !!currentSubscription &&
    !['canceled', 'past_due'].includes(currentSubscription.status);
  const maxSeats =
    (currentSubscriptionIsActive &&
      currentSubscription.items[0]?.price.product.maxSeats) ||
    25;
  return organization._count.memberships >= maxSeats;
};

/**
 * Retrieves the invite info from the request.
 *
 * @param request - The request to get the invite info from.
 * @returns The invite info.
 */
export async function getInviteInfoForAuthRoutes(request: Request) {
  const { inviteLinkInfo, emailInviteInfo } = await promiseHash({
    inviteLinkInfo: getValidInviteLinkInfo(request),
    emailInviteInfo: getValidEmailInviteInfo(request),
  });

  return {
    inviteLinkInfo: emailInviteInfo.emailInviteInfo
      ? {
          inviteLinkId: emailInviteInfo.emailInviteInfo.emailInviteId,
          creatorName: emailInviteInfo.emailInviteInfo.inviterName,
          organizationName: emailInviteInfo.emailInviteInfo.organizationName,
          organizationSlug: emailInviteInfo.emailInviteInfo.organizationSlug,
          type: 'emailInvite',
        }
      : inviteLinkInfo.inviteLinkInfo
        ? { ...inviteLinkInfo.inviteLinkInfo, type: 'inviteLink' }
        : undefined,
    headers: combineHeaders(inviteLinkInfo.headers, emailInviteInfo.headers),
  };
}
