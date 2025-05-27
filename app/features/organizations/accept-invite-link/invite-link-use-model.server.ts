import type {
  InviteLinkUse,
  OrganizationInviteLink,
  UserAccount,
} from '@prisma/client';

import { prisma } from '~/utils/database.server';

export type PartialinviteLinkUseParameters = Pick<
  Parameters<typeof prisma.inviteLinkUse.create>[0]['data'],
  'id'
>;

/* CREATE */

/**
 * Saves a new Invite Link Uses to the database.
 *
 * @param Invite Link Uses - Parameters of the Invite Link Uses that should be created.
 * @returns The newly created Invite Link Uses.
 */
export function saveInviteLinkUseToDatabase(
  inviteLinkUse: PartialinviteLinkUseParameters & {
    inviteLinkId: OrganizationInviteLink['id'];
    userId: UserAccount['id'];
  },
) {
  return prisma.inviteLinkUse.create({ data: inviteLinkUse });
}

/* READ */

/**
 * Retrieves a Invite Link Uses record from the database based on its id.
 *
 * @param id - The id of the Invite Link Uses to get.
 * @returns The Invite Link Uses with a given id or null if it wasn't found.
 */
export function retrieveInviteLinkUseFromDatabaseById(id: InviteLinkUse['id']) {
  return prisma.inviteLinkUse.findUnique({ where: { id } });
}

export function retrieveInviteLinkUseFromDatabaseByUserIdAndLinkId({
  inviteLinkId,
  userId,
}: {
  inviteLinkId: OrganizationInviteLink['id'];
  userId: UserAccount['id'];
}) {
  return prisma.inviteLinkUse.findUnique({
    where: { inviteLinkId_userId: { inviteLinkId, userId } },
  });
}

/* DELETE */

/**
 * Removes a Invite Link Uses from the database.
 *
 * @param id - The id of the Invite Link Uses you want to delete.
 * @returns The Invite Link Uses that was deleted.
 */
export async function deleteInviteLinkUseFromDatabaseById(
  id: InviteLinkUse['id'],
) {
  return prisma.inviteLinkUse.delete({ where: { id } });
}
