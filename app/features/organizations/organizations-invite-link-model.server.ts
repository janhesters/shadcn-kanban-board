/* eslint-disable unicorn/no-null */
import type { OrganizationInviteLink, Prisma } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves an organization invite link to the database.
 *
 * @param inviteLink - The invite link to save.
 * @returns The saved invite link.
 */
export async function saveOrganizationInviteLinkToDatabase(
  inviteLink: Prisma.OrganizationInviteLinkUncheckedCreateInput,
) {
  return prisma.organizationInviteLink.create({ data: inviteLink });
}

/* READ */

/**
 * Retrieves an organization invite link from the database by id.
 *
 * @param id - The id of the organization invite link to retrieve.
 * @returns The organization invite link or null if not found.
 */
export async function retrieveOrganizationInviteLinkFromDatabaseById(
  id: OrganizationInviteLink['id'],
) {
  return prisma.organizationInviteLink.findUnique({ where: { id } });
}

/**
 * Retrieves an active organization invite link from the database based on
 * its id.
 *
 * @param id - The id of the organization invite link to get.
 * @returns The organization invite link with a given id or null if it
 * wasn't found or its deactivated or expired.
 */
export async function retrieveActiveOrganizationInviteLinkFromDatabaseByToken(
  token: OrganizationInviteLink['token'],
) {
  return prisma.organizationInviteLink.findUnique({
    where: { token, deactivatedAt: null, expiresAt: { gt: new Date() } },
    include: {
      organization: { select: { name: true, id: true, slug: true } },
      creator: { select: { name: true, id: true } },
    },
  });
}

/**
 * Retrieves an active organization invite link and its associated creator and
 * organization from the database based on the token.
 *
 * @param token - The token of the OrganizationInviteLink to retrieve.
 * @returns An object containing the invite link id, creator details, expiration
 * date, and organization details, or null if no active link was found.
 */
export async function retrieveCreatorAndOrganizationForActiveLinkFromDatabaseByToken(
  token: OrganizationInviteLink['token'],
) {
  return prisma.organizationInviteLink.findUnique({
    where: { token, deactivatedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      creator: { select: { name: true, id: true } },
      expiresAt: true,
      organization: { select: { name: true, id: true } },
    },
  });
}

/**
 * Retrieves the latest active invite link for an organization.
 *
 * @param organizationId - The id of the organization to retrieve the invite
 * link for.
 * @returns The latest active invite link or null if not found.
 */
export async function retrieveLatestInviteLinkFromDatabaseByOrganizationId(
  organizationId: OrganizationInviteLink['organizationId'],
) {
  return prisma.organizationInviteLink.findFirst({
    where: {
      organizationId,
      expiresAt: { gt: new Date() },
      deactivatedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
}

/**
 * Retrieves an active OrganizationInviteLink record from the database based on
 * its token.
 *
 * @param token - The token of the OrganizationInviteLink to get.
 * @returns The OrganizationInviteLink with a given token or null if it wasn't
 * found or its deactivated or expired.
 */
export async function retrieveActiveInviteLinkFromDatabaseByToken(
  token: OrganizationInviteLink['token'],
) {
  const now = new Date();
  return prisma.organizationInviteLink.findFirst({
    where: { token, deactivatedAt: null, expiresAt: { gt: now } },
    select: {
      creator: { select: { id: true, name: true } },
      deactivatedAt: true,
      expiresAt: true,
      id: true,
      organization: { select: { id: true, name: true, slug: true } },
      token: true,
    },
  });
}

/* UPDATE */

/**
 * Updates an organization invite link by its id.
 *
 * @param id - The id of the invite link to update.
 * @param organizationInviteLink - The new data for the invite link.
 * @returns The updated invite link.
 */
export async function updateOrganizationInviteLinkInDatabaseById({
  id,
  organizationInviteLink,
}: {
  id: OrganizationInviteLink['id'];
  organizationInviteLink: Prisma.OrganizationInviteLinkUpdateInput;
}) {
  return prisma.organizationInviteLink.update({
    where: { id },
    data: organizationInviteLink,
  });
}
