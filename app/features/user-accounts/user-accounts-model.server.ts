/* eslint-disable unicorn/no-null */
import type { Prisma, UserAccount } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a user account to the database.
 *
 * @param userAccount The user account to save.
 * @returns The saved user account.
 */
export async function saveUserAccountToDatabase(
  userAccount: Prisma.UserAccountCreateInput,
) {
  return prisma.userAccount.create({ data: userAccount });
}

/* READ */

/**
 * Retrieves a user account by its id.
 *
 * @param id The id of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseById(
  id: UserAccount['id'],
) {
  return prisma.userAccount.findUnique({ where: { id } });
}

/**
 * Retrieves a user account by its email.
 *
 * @param email The email of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseByEmail(
  email: UserAccount['email'],
) {
  return prisma.userAccount.findUnique({ where: { email } });
}

/**
 * Retrieve a user account with their active organization memberships by email.
 *
 * @param email The email of the user account.
 * @returns The user account with active memberships or null.
 */
export async function retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(
  email: UserAccount['email'],
) {
  return prisma.userAccount.findUnique({
    where: { email },
    include: {
      memberships: {
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
    },
  });
}

/**
 * Retrieves a user account by their Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount['supabaseUserId'],
) {
  return prisma.userAccount.findUnique({ where: { supabaseUserId } });
}

/**
 * Retrieves a user account and their active organization memberships by
 * Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships or null. Active memberships
 * are those that are either not deactivated or have a deactivation date in the
 * future.
 */
export async function retrieveUserAccountWithMembershipsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount['supabaseUserId'],
) {
  return prisma.userAccount.findUnique({
    where: { supabaseUserId },
    include: {
      memberships: {
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
        select: {
          organization: {
            select: {
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
              billingEmail: true,
              id: true,
              imageUrl: true,
              name: true,
              slug: true,
              stripeCustomerId: true,
              stripeSubscriptions: {
                orderBy: { created: 'desc' },
                take: 1,
                include: {
                  items: { include: { price: { include: { product: true } } } },
                  schedule: {
                    where: {
                      currentPhaseStart: { not: null },
                      currentPhaseEnd: { not: null },
                    },
                    include: {
                      phases: {
                        orderBy: { startDate: 'asc' },
                        include: { price: true },
                      },
                    },
                  },
                },
              },
              trialEnd: true,
            },
          },
          role: true,
          deactivatedAt: true,
        },
      },
    },
  });
}

/**
 * Retrieves a user account, their active organization memberships, and the count
 * of members in each organization by Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships and member counts or null.
 * Active memberships are those that are either not deactivated or have a
 * deactivation date in the future.
 */
export async function retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount['supabaseUserId'],
) {
  return prisma.userAccount.findUnique({
    where: { supabaseUserId },
    include: {
      memberships: {
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              // Count active members in the organization
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
            },
          },
          role: true,
          deactivatedAt: true,
        },
      },
    },
  });
}

/**
 * Retrieves a user account, their active organization memberships, and the
 * count of members in each organization by Supabase ID. Also includes the
 * organization's subscription.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships and member counts or null.
 * Active memberships are those that are either not deactivated or have a
 * deactivation date in the future.
 */
export async function retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount['supabaseUserId'],
) {
  return prisma.userAccount.findUnique({
    where: { supabaseUserId },
    include: {
      memberships: {
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              // Count active members in the organization
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
              stripeSubscriptions: {
                orderBy: { created: 'desc' },
                take: 1,
                include: {
                  items: { include: { price: true } },
                  schedule: {
                    include: {
                      phases: {
                        orderBy: { startDate: 'asc' },
                        include: { price: true },
                      },
                    },
                  },
                },
              },
            },
          },
          role: true,
          deactivatedAt: true,
        },
      },
    },
  });
}

/* UPDATE */

/**
 * Updates a user account by its id.
 *
 * @param id The id of the user account.
 * @param data The new data for the user account.
 * @returns The updated user account.
 */
export async function updateUserAccountInDatabaseById({
  id,
  user,
}: {
  id: UserAccount['id'];
  user: Omit<Prisma.UserAccountUpdateInput, 'id'>;
}) {
  return prisma.userAccount.update({ where: { id }, data: user });
}

/* DELETE */

/**
 * Deletes a user account from the database.
 *
 * @param id The id of the user account to delete.
 * @returns The deleted user account.
 */
export async function deleteUserAccountFromDatabaseById(id: UserAccount['id']) {
  return prisma.userAccount.delete({ where: { id } });
}
