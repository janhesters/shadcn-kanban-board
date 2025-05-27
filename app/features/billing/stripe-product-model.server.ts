import type { Prisma, StripeProduct } from '@prisma/client';
import type { Stripe } from 'stripe';
import { z } from 'zod';

import { prisma } from '~/utils/database.server';

const maxSeatsSchema = z.preprocess(value => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}, z.number().int().positive().default(1));

/* CREATE */

/**
 * Saves a new Stripe product to the database.
 *
 * @param product - The Stripe product to save.
 * @returns The saved Stripe product.
 */
export async function saveStripeProductToDatabase(
  product: Prisma.StripeProductCreateInput,
) {
  return prisma.stripeProduct.create({ data: product });
}

/**
 * Creates a new Stripe product in the database.
 *
 * The `max_seats` metadata field is parsed using the `maxSeatsSchema` schema.
 *
 * @param product - The Stripe product to create.
 * @returns The created Stripe product.
 */
export async function saveStripeProductFromAPIToDatabase(
  product: Stripe.Product,
) {
  return prisma.stripeProduct.create({
    data: {
      stripeId: product.id,
      name: product.name,
      maxSeats: maxSeatsSchema.parse(product.metadata.max_seats),
      active: product.active,
    },
  });
}

/* READ */

/**
 * Retrieves a Stripe product from the database by its Stripe ID.
 *
 * @param stripeId - The Stripe ID of the product to retrieve.
 * @returns The retrieved Stripe product.
 */
export async function retrieveStripeProductFromDatabaseById(
  stripeId: StripeProduct['stripeId'],
) {
  return prisma.stripeProduct.findUnique({ where: { stripeId } });
}

/**
 * Retrieves Stripe products from the database by their price lookup keys.
 *
 * @param lookupKeys - The price lookup keys of the products to retrieve.
 * @returns The retrieved Stripe products.
 */
export async function retrieveProductsFromDatabaseByPriceLookupKeys(
  lookupKeys: string[],
) {
  return prisma.stripeProduct.findMany({
    where: { prices: { some: { lookupKey: { in: lookupKeys } } } },
    include: { prices: { where: { lookupKey: { in: lookupKeys } } } },
  });
}

/* UPDATE */

/**
 * Updates an existing Stripe product in the database.
 *
 * The `max_seats` metadata field is parsed using the `maxSeatsSchema` schema.
 *
 * @param product - The Stripe product to update.
 * @returns The updated Stripe product.
 */
export async function updateStripeProductFromAPIInDatabase(
  product: Stripe.Product,
) {
  return prisma.stripeProduct.update({
    where: { stripeId: product.id },
    data: {
      name: product.name,
      maxSeats: maxSeatsSchema.parse(product.metadata.max_seats),
      active: product.active,
    },
  });
}

/* DELETE */

/**
 * Deletes a Stripe product from the database by its Stripe ID.
 *
 * @param stripeId - The Stripe ID of the product to delete.
 * @returns The deleted Stripe product.
 */
export async function deleteStripeProductFromDatabaseById(
  stripeId: StripeProduct['stripeId'],
) {
  return prisma.stripeProduct.delete({ where: { stripeId } });
}
