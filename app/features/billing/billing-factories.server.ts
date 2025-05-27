/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type {
  StripePrice,
  StripeProduct,
  StripeSubscription,
  StripeSubscriptionItem,
  StripeSubscriptionSchedule,
  StripeSubscriptionSchedulePhase,
} from '@prisma/client';
import { StripePriceInterval } from '@prisma/client';

import type { DeepPartial, Factory } from '~/utils/types';

import { allLookupKeys, allTiers } from './billing-constants';

export const getRandomTier = () => faker.helpers.arrayElement(allTiers);
export const getRandomLookupKey = () =>
  faker.helpers.arrayElement(allLookupKeys);

/* Base factories */

export const createPopulatedStripeProduct: Factory<StripeProduct> = ({
  stripeId = `prod_${createId()}`,
  active = true,
  name = faker.commerce.productName(),
  maxSeats = faker.number.int({ min: 1, max: 100 }),
} = {}) => ({ stripeId, active, name, maxSeats });

/**
 * Creates a Stripe price with populated values.
 *
 * @param priceParams - StripePrice params to create price with.
 * @returns A populated Stripe price with given params.
 */
export const createPopulatedStripePrice: Factory<StripePrice> = ({
  lookupKey = `${faker.word.noun()}_${faker.word.noun()}_${faker.word.noun()}`,
  stripeId = `price_${createId()}`,
  active = true,
  currency = 'usd',
  productId = `prod_${createId()}`,
  unitAmount = faker.number.int({ min: 500, max: 50_000 }),
  interval = faker.helpers.arrayElement([
    StripePriceInterval.month,
    StripePriceInterval.year,
  ]),
} = {}) => ({
  stripeId,
  active,
  currency,
  lookupKey,
  productId,
  unitAmount,
  interval,
});

/**
 * Creates a Stripe subscription schedule with populated values.
 *
 * @param scheduleParams - StripeSubscriptionSchedule params to create the schedule with.
 * @returns A populated Stripe subscription schedule with given params.
 */
export const createPopulatedStripeSubscriptionSchedule: Factory<
  StripeSubscriptionSchedule
> = ({
  stripeId = `sub_sched_${createId()}`,
  subscriptionId = createPopulatedStripeSubscription().stripeId,
  created = faker.date.past({ years: 1 }),
  currentPhaseStart = faker.date.past({ years: 1 }),
  currentPhaseEnd = currentPhaseStart
    ? faker.date.future({ years: 1, refDate: currentPhaseStart })
    : null,
} = {}) => ({
  stripeId,
  subscriptionId,
  created,
  currentPhaseStart,
  currentPhaseEnd,
});

/**
 * Creates a Stripe subscription schedule phase with populated values.
 *
 * @param phaseParams - StripeSubscriptionSchedulePhase params to create the phase with.
 * @returns A populated Stripe subscription schedule phase with given params.
 */
export const createPopulatedStripeSubscriptionSchedulePhase: Factory<
  StripeSubscriptionSchedulePhase
> = ({
  id = createId(),
  scheduleId = createPopulatedStripeSubscriptionSchedule().stripeId,
  startDate = faker.date.past({ years: 1 }),
  endDate = faker.date.future({ years: 1, refDate: startDate }),
  priceId = `price_${createId()}`,
  quantity = faker.number.int({ min: 1, max: 100 }),
} = {}) => ({
  id,
  scheduleId,
  startDate,
  endDate,
  priceId,
  quantity,
});

/**
 * Creates a Stripe subscription item with populated values.
 *
 * @param subscriptionItemParams - StripeSubscriptionItem params to create subscription item with.
 * @returns A populated Stripe subscription item with given params.
 */
export const createPopulatedStripeSubscriptionItem: Factory<
  StripeSubscriptionItem
> = ({
  stripeId = `si_${createId()}`,
  stripeSubscriptionId = `sub_${createId()}`,
  currentPeriodEnd = faker.date.future({ years: 1 }),
  currentPeriodStart = faker.date.past({ years: 1, refDate: currentPeriodEnd }),
  priceId = `price_${createId()}`,
} = {}) => ({
  stripeId,
  stripeSubscriptionId,
  currentPeriodEnd,
  currentPeriodStart,
  priceId,
});

/**
 * Creates a Stripe subscription with populated values.
 *
 * @param subscriptionParams - StripeSubscription params to create subscription with.
 * @returns A populated Stripe subscription with given params.
 */
export const createPopulatedStripeSubscription: Factory<StripeSubscription> = ({
  stripeId = `sub_${createId()}`,
  organizationId = createId(),
  purchasedById = createId(),
  created = faker.date.past({ years: 1 }),
  cancelAtPeriodEnd = false,
  status = 'active',
} = {}) => ({
  stripeId,
  organizationId,
  purchasedById,
  created,
  cancelAtPeriodEnd,
  status,
});

/* Compound Factories */

export type StripeProductWithPrices = StripeProduct & {
  prices: StripePrice[];
};

/**
 * Creates a Stripe product with its associated prices.
 *
 * @param overrides - Optional parameters to customize the product and prices.
 * @param overrides.prices - Optional array of price override values.
 * @param overrides.productOverrides - Optional product override values.
 * @returns A populated Stripe product with its associated prices.
 */
export function createStripeProductWithPrices(
  overrides: DeepPartial<StripeProductWithPrices> = {},
): StripeProductWithPrices {
  const { prices: pricesOverride, ...productOverrides } = overrides;

  // Create the base product
  const product = createPopulatedStripeProduct(productOverrides);

  // Handle price overrides, defaulting to two prices if none given
  const prices = Array.isArray(pricesOverride)
    ? pricesOverride.map(priceOvr =>
        createPopulatedStripePrice({
          ...priceOvr,
          productId: product.stripeId,
        }),
      )
    : [
        createPopulatedStripePrice({ productId: product.stripeId }),
        createPopulatedStripePrice({ productId: product.stripeId }),
      ];

  return { ...product, ...overrides, prices };
}

export type StripePriceWithProduct = StripePrice & {
  product: StripeProduct;
};

/**
 * Creates a Stripe price with its associated product.
 *
 * @param params - Optional parameters to customize the price and product.
 * @param params.product - Optional product override values.
 * @param params.priceOverrides - Optional price override values.
 * @returns A populated Stripe price with its associated product.
 */
export function createPopulatedStripePriceWithProduct(
  overrides: DeepPartial<StripePriceWithProduct> = {},
): StripePriceWithProduct {
  const product = createPopulatedStripeProduct(overrides.product);
  const base = createPopulatedStripePrice({
    lookupKey: getRandomLookupKey(),
    ...overrides,
    productId: product.stripeId,
  });
  return { ...base, ...overrides, product };
}

export type StripeSubscriptionItemWithPriceAndProduct =
  StripeSubscriptionItem & {
    price: StripePriceWithProduct;
  };

/**
 * Creates a Stripe subscription item with its associated price and product.
 *
 * @param params - Optional parameters to customize the subscription item.
 * @param params.price - Optional price (with product) override values.
 * @param params.itemOverrides - Optional subscription item override values.
 * @returns A populated Stripe subscription item with its associated price and product.
 */
export function createPopulatedStripeSubscriptionItemWithPriceAndProduct(
  overrides: DeepPartial<StripeSubscriptionItemWithPriceAndProduct> = {},
): StripeSubscriptionItemWithPriceAndProduct {
  const price = createPopulatedStripePriceWithProduct(overrides.price);
  const base = createPopulatedStripeSubscriptionItem({
    ...overrides,
    priceId: price.stripeId,
  });
  return { ...base, ...overrides, price };
}

export type StripeSubscriptionWithItemsAndPriceAndProduct =
  StripeSubscription & {
    items: StripeSubscriptionItemWithPriceAndProduct[];
  };

/**
 * Creates a Stripe subscription with its associated subscription items, prices and products.
 *
 * @param params - Optional parameters to customize the subscription.
 * @param params.items - Optional array of subscription items with prices and products.
 * @param params.subscriptionOverrides - Optional subscription override values.
 * @returns A populated Stripe subscription with all associated data.
 */
export function createPopulatedStripeSubscriptionWithItemsAndPriceAndProduct(
  overrides: DeepPartial<StripeSubscriptionWithItemsAndPriceAndProduct> = {},
): StripeSubscriptionWithItemsAndPriceAndProduct {
  const { items: itemsOverride, ...subscriptionBaseOverride } = overrides;

  // Base subscription (just top-level fields)
  const baseSubscription = createPopulatedStripeSubscription(
    subscriptionBaseOverride,
  );

  // Items: if provided (even empty), map overrides; else default one
  const items = Array.isArray(itemsOverride)
    ? itemsOverride.map(itemOverride =>
        createPopulatedStripeSubscriptionItemWithPriceAndProduct(itemOverride),
      )
    : [createPopulatedStripeSubscriptionItemWithPriceAndProduct()];

  return { ...baseSubscription, ...overrides, items };
}

export type StripeSubscriptionSchedulePhaseWithPrice =
  StripeSubscriptionSchedulePhase & {
    price: StripePrice;
  };

export function createPopulatedStripeSubscriptionSchedulePhaseWithPrice(
  overrides: DeepPartial<StripeSubscriptionSchedulePhaseWithPrice> = {},
): StripeSubscriptionSchedulePhaseWithPrice {
  // generate the full price (no product)
  const price = createPopulatedStripePrice(overrides.price);
  // then build the "base" phase, syncing priceId
  const base = createPopulatedStripeSubscriptionSchedulePhase({
    ...overrides,
    priceId: price.stripeId,
  });
  return { ...base, ...overrides, price };
}

export type StripeSubscriptionScheduleWithPhasesAndPrice =
  StripeSubscriptionSchedule & {
    phases: StripeSubscriptionSchedulePhaseWithPrice[];
  };

/**
 * Creates a Stripe subscription schedule with its associated phases.
 *
 * @param params - Optional parameters to customize the subscription schedule.
 * @param params.stripeId - Optional stripe ID for the schedule.
 * @param params.phases - Optional array of phase override values.
 * @param params.scheduleOverrides - Optional schedule override values.
 * @returns A populated Stripe subscription schedule with its associated phases.
 */
export function createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice(
  overrides: DeepPartial<StripeSubscriptionScheduleWithPhasesAndPrice> = {},
): StripeSubscriptionScheduleWithPhasesAndPrice {
  const base = createPopulatedStripeSubscriptionSchedule({
    ...overrides,
    stripeId: overrides.stripeId ?? undefined,
  });

  // if caller passed phases (even empty), map overrides; otherwise default one
  const phasesOverride = overrides.phases;
  const phases = Array.isArray(phasesOverride)
    ? phasesOverride.map(phOvr =>
        createPopulatedStripeSubscriptionSchedulePhaseWithPrice({
          ...phOvr,
          scheduleId: base.stripeId,
        }),
      )
    : [
        createPopulatedStripeSubscriptionSchedulePhaseWithPrice({
          scheduleId: base.stripeId,
        }),
      ];

  return { ...base, ...overrides, phases };
}

export type StripeSubscriptionItemWithPrice = StripeSubscriptionItem & {
  price: StripePrice;
};

export type StripeSubscriptionWithItemsAndPrice = StripeSubscription & {
  items: StripeSubscriptionItemWithPrice[];
};

/**
 * Creates a Stripe subscription with its associated subscription items and their prices.
 *
 * @param params - Optional parameters to customize the subscription.
 * @param params.items - Optional array of subscription items with prices.
 * @param params.subscriptionOverrides - Optional subscription override values.
 * @returns A populated Stripe subscription with its associated items and their prices.
 */
export function createPopulatedStripeSubscriptionWithItemsAndPrice(
  overrides: DeepPartial<StripeSubscriptionWithItemsAndPrice> = {},
): StripeSubscriptionWithItemsAndPrice {
  const { items: itemsOverride, ...subscriptionBaseOverride } = overrides;

  const baseSubscription = createPopulatedStripeSubscription(
    subscriptionBaseOverride,
  );

  const items = Array.isArray(itemsOverride)
    ? itemsOverride.map(itemOverride => {
        const price = createPopulatedStripePrice({
          lookupKey: getRandomLookupKey(),
          ...itemOverride?.price,
        });
        const base = createPopulatedStripeSubscriptionItem({
          ...itemOverride,
          priceId: price.stripeId,
        });
        return { ...base, ...itemOverride, price };
      })
    : [
        (() => {
          const price = createPopulatedStripePrice({
            lookupKey: getRandomLookupKey(),
          });
          const base = createPopulatedStripeSubscriptionItem({
            priceId: price.stripeId,
          });
          return { ...base, price };
        })(),
      ];

  return { ...baseSubscription, ...overrides, items };
}

export type StripeSubscriptionWithScheduleAndItemsWithPriceAndProduct =
  StripeSubscription & {
    schedule: StripeSubscriptionScheduleWithPhasesAndPrice;
    items: StripeSubscriptionItemWithPriceAndProduct[];
  };

/**
 * Creates a complete Stripe subscription with schedule, items, prices and products.
 *
 * @param params - Optional parameters to customize the subscription.
 * @param params.items - Optional array of subscription items with prices and products.
 * @param params.schedule - Optional subscription schedule with phases.
 * @param params.subscriptionOverrides - Optional subscription override values.
 * @returns A populated Stripe subscription with all associated data.
 */
export function createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
  overrides: DeepPartial<StripeSubscriptionWithScheduleAndItemsWithPriceAndProduct> = {},
): StripeSubscriptionWithScheduleAndItemsWithPriceAndProduct {
  // Pull out array overrides so they don't go to the base subscription factory
  const {
    items: itemsOverride,
    schedule: scheduleOverride,
    ...subscriptionBaseOverride
  } = overrides;

  // Base subscription (just top-level fields)
  const baseSubscription = createPopulatedStripeSubscription(
    subscriptionBaseOverride,
  );

  // Items: if provided (even empty), map overrides; else default one
  const items = Array.isArray(itemsOverride)
    ? itemsOverride.map(itemOverride =>
        createPopulatedStripeSubscriptionItemWithPriceAndProduct(itemOverride),
      )
    : [createPopulatedStripeSubscriptionItemWithPriceAndProduct()];

  // Schedule: same logic as items
  const schedule =
    createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice(
      scheduleOverride,
    );

  return { ...baseSubscription, ...overrides, items, schedule };
}
