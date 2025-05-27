import type { Organization, Prisma, StripeSubscription } from '@prisma/client';
import type Stripe from 'stripe';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a Stripe subscription to our database.
 *
 * @param subscription - The Stripe subscription to save.
 * @returns The saved Stripe subscription.
 */
export async function saveStripeSubscriptionToDatabase(
  subscription: Prisma.StripeSubscriptionUncheckedCreateInput,
) {
  return prisma.stripeSubscription.create({ data: subscription });
}

/**
 * Creates a new Stripe subscription and its items in our database.
 * Expects organizationId and purchasedById in subscription.metadata.
 *
 * @param stripeSubscription - Stripe.Subscription with metadata: organizationId, purchasedById.
 * @returns The created StripeSubscription record.
 */
export async function createStripeSubscriptionInDatabase(
  stripeSubscription: Stripe.Subscription,
) {
  const { metadata } = stripeSubscription;
  const organizationId = metadata.organizationId;
  const purchasedById = metadata.purchasedById;

  return prisma.stripeSubscription.create({
    data: {
      stripeId: stripeSubscription.id,
      organization: { connect: { id: organizationId } },
      purchasedBy: { connect: { id: purchasedById } },
      created: new Date(stripeSubscription.created * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      status: stripeSubscription.status,
      items: {
        create: stripeSubscription.items.data.map(item => ({
          stripeId: item.id,
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          price: { connect: { stripeId: item.price.id } },
        })),
      },
    },
  });
}

/* READ */

/**
 * Retrieves a Stripe subscription from our database by its ID.
 *
 * @param stripeId - The ID of the Stripe subscription to retrieve
 * @returns The retrieved StripeSubscription record
 */
export async function retrieveStripeSubscriptionFromDatabaseById(
  stripeId: StripeSubscription['stripeId'],
) {
  return await prisma.stripeSubscription.findUnique({ where: { stripeId } });
}

/**
 * Retrieves a Stripe subscription from our database by its ID, including its items.
 *
 * @param stripeId - The ID of the Stripe subscription to retrieve
 * @returns The retrieved StripeSubscription record with its items
 */
export async function retrieveStripeSubscriptionWithItemsFromDatabaseById(
  stripeId: StripeSubscription['stripeId'],
) {
  return await prisma.stripeSubscription.findUnique({
    where: { stripeId },
    include: { items: true },
  });
}

/**
 * Retrieves the latest Stripe subscription for an organization, regardless of
 * status.
 * Orders by creation date to ensure we get the most recent subscription.
 *
 * @param organizationId - The ID of the organization to retrieve the
 * subscription for
 * @returns The most recent Stripe subscription for the organization,
 * including subscription items and prices. Returns null if no subscription
 * exists.
 */
export async function retrieveLatestStripeSubscriptionWithActiveScheduleAndPhasesByOrganizationId(
  organizationId: Organization['id'],
) {
  return await prisma.stripeSubscription.findFirst({
    where: { organizationId },
    orderBy: { created: 'desc' },
    include: {
      items: {
        include: { price: true },
      },
      schedule: { include: { phases: { include: { price: true } } } },
    },
  });
}

/* UPDATE */

/**
 * Updates a Stripe subscription in our database by its ID.
 *
 * @param id - The ID of the Stripe subscription to update
 * @param subscription - The new data for the Stripe subscription
 * @returns The updated StripeSubscription record
 */
export async function updateStripeSubscriptionInDatabaseById({
  id,
  subscription,
}: {
  id: StripeSubscription['stripeId'];
  subscription: Omit<Prisma.StripeSubscriptionUpdateInput, 'id'>;
}) {
  return await prisma.stripeSubscription.update({
    where: { stripeId: id },
    data: subscription,
  });
}

/**
 * Updates an existing Stripe subscription and its items in our database.
 * Expects organizationId and purchasedById in subscription.metadata.
 *
 * @param stripeSubscription - Stripe.Subscription with metadata: organizationId, purchasedById.
 * @returns The updated StripeSubscription record.
 */
export async function updateStripeSubscriptionFromAPIInDatabase(
  stripeSubscription: Stripe.Subscription,
) {
  const { metadata } = stripeSubscription;
  const purchasedById = metadata.purchasedById;

  return prisma.stripeSubscription.update({
    where: { stripeId: stripeSubscription.id },
    data: {
      purchasedBy: { connect: { id: purchasedById } },
      created: new Date(stripeSubscription.created * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      status: stripeSubscription.status,
      items: {
        deleteMany: {},
        create: stripeSubscription.items.data.map(item => ({
          stripeId: item.id,
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          price: { connect: { stripeId: item.price.id } },
        })),
      },
    },
  });
}

/* DELETE */

/**
 * Deletes a Stripe subscription from our database by its ID.
 *
 * @param stripeId - The ID of the Stripe subscription to delete
 * @returns The deleted StripeSubscription record
 */
export async function deleteStripeSubscriptionFromDatabaseById(
  stripeId: StripeSubscription['stripeId'],
) {
  return await prisma.stripeSubscription.delete({ where: { stripeId } });
}
