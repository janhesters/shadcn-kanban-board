import type { Prisma, StripePrice } from '@prisma/client';
import type { Stripe } from 'stripe';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a new Stripe price to the database.
 *
 * @param price - The Stripe price to save.
 * @returns The saved Stripe price.
 */
export async function saveStripePriceToDatabase(
  price: Prisma.StripePriceUncheckedCreateInput,
) {
  return prisma.stripePrice.create({ data: price });
}

/**
 * Creates a new Stripe price in the database.
 *
 * @param price - The Stripe price to create.
 * @returns The created Stripe price.
 */
export async function saveStripePriceFromAPIToDatabase(price: Stripe.Price) {
  return prisma.stripePrice.create({
    data: {
      stripeId: price.id,
      currency: price.currency,
      lookupKey: price.lookup_key ?? '',
      unitAmount: price.unit_amount ?? 0,
      active: price.active,
      product: { connect: { stripeId: price.product as string } },
      interval: price.recurring!.interval,
    },
  });
}

/* READ */
/**
 * Retrieves a Stripe price from the database by its lookup key.
 *
 * @param lookupKey - The lookup key of the price to retrieve.
 * @returns The retrieved Stripe price.
 */
export async function retrieveStripePriceFromDatabaseByLookupKey(
  lookupKey: StripePrice['lookupKey'],
) {
  return prisma.stripePrice.findUnique({ where: { lookupKey } });
}

/**
 * Retrieves a Stripe price with its associated product from the database by lookup key.
 *
 * @param lookupKey - The lookup key of the price to retrieve.
 * @returns The retrieved Stripe price with its product.
 */
export async function retrieveStripePriceWithProductFromDatabaseByLookupKey(
  lookupKey: StripePrice['lookupKey'],
) {
  return prisma.stripePrice.findUnique({
    where: { lookupKey },
    include: { product: true },
  });
}

/* UPDATE */

/**
 * Updates an existing Stripe price in the database.
 *
 * @param price - The Stripe price to update.
 * @returns The updated Stripe price.
 */
export async function updateStripePriceFromAPIInDatabase(price: Stripe.Price) {
  return prisma.stripePrice.update({
    where: { stripeId: price.id },
    data: {
      currency: price.currency,
      lookupKey: price.lookup_key ?? '',
      unitAmount: price.unit_amount ?? 0,
      active: price.active,
      interval: price.recurring!.interval,
      product: { connect: { stripeId: price.product as string } },
    },
  });
}

/* DELETE */

/**
 * Deletes a Stripe price from the database by its Stripe ID.
 *
 * @param stripeId - The Stripe ID of the price to delete.
 * @returns The deleted price.
 */
export async function deleteStripePriceFromDatabaseById(
  stripeId: StripePrice['stripeId'],
) {
  return prisma.stripePrice.delete({ where: { stripeId } });
}
