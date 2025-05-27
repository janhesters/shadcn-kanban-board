import { StripePriceInterval } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import {
  createOrganizationWithMembershipsAndSubscriptions,
  createPopulatedOrganization,
} from '../organizations/organizations-factories.server';
import { priceLookupKeysByTierAndInterval } from './billing-constants';
import {
  createPopulatedStripePriceWithProduct,
  createPopulatedStripeSubscriptionItem,
  createPopulatedStripeSubscriptionSchedule,
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
  createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct,
  createStripeProductWithPrices,
} from './billing-factories.server';
import type { ProductsForBillingPage } from './billing-helpers.server';
import {
  extractBaseUrl,
  getCreateSubscriptionModalProps,
  mapStripeSubscriptionDataToBillingPageProps,
} from './billing-helpers.server';
import type { BillingPageProps } from './billing-page';

describe('mapStripeSubscriptionDataToBillingPageProps()', () => {
  test('given: an active paid monthly plan, should: return correct billing props', () => {
    const now = new Date('2025-06-01T00:00:00.000Z');
    const subscription =
      createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct({
        organizationId: 'org-123',
        cancelAtPeriodEnd: false,
        status: 'active',
        items: [
          {
            price: createPopulatedStripePriceWithProduct({
              lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
              unitAmount: 2000,
              product: { maxSeats: 10 },
              interval: StripePriceInterval.month,
            }),
            ...createPopulatedStripeSubscriptionItem({
              currentPeriodStart: new Date('2025-05-15T00:00:00.000Z'),
              currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
            }),
          },
        ],
      });
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 4,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: Omit<BillingPageProps, 'createSubscriptionModalProps'> = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: true,
        currentTier: 'mid',
        currentTierInterval: 'monthly',
      },
      currentInterval: 'monthly',
      currentMonthlyRatePerUser: 20,
      currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
      currentSeats: 4,
      currentTier: 'mid',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 10,
      organizationSlug: organization.slug,
      projectedTotal: 80,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription cancelled at period end but still ongoing, should: mark status “active”', () => {
    const now = new Date('2025-06-10T00:00:00.000Z');
    const subscription =
      createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct({
        organizationId: 'org-456',
        cancelAtPeriodEnd: true,
        status: 'active',
        items: [
          {
            price: createPopulatedStripePriceWithProduct({
              lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
              unitAmount: 5000,
              product: { maxSeats: 25 },
              interval: StripePriceInterval.month,
            }),
            ...createPopulatedStripeSubscriptionItem({
              currentPeriodStart: new Date('2025-06-01T00:00:00.000Z'),
              currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
            }),
          },
        ],
      });
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 8,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: Omit<BillingPageProps, 'createSubscriptionModalProps'> = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: true,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: false,
        currentTier: 'high',
        currentTierInterval: 'monthly',
      },
      currentMonthlyRatePerUser: 50,
      currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
      currentSeats: 8,
      currentInterval: 'monthly',
      currentTier: 'high',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 400,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription cancelled at period end and it ran out, should: mark status “paused”', () => {
    const now = new Date('2025-06-10T00:00:00.000Z');
    const subscription =
      createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct({
        organizationId: 'org-456',
        cancelAtPeriodEnd: true,
        status: 'active',
        items: [
          {
            price: createPopulatedStripePriceWithProduct({
              lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
              unitAmount: 5000,
              product: { maxSeats: 25 },
              interval: StripePriceInterval.month,
            }),
            ...createPopulatedStripeSubscriptionItem({
              currentPeriodStart: new Date('2025-06-01T00:00:00.000Z'),
              currentPeriodEnd: new Date('2025-06-09T00:00:00.000Z'),
            }),
          },
        ],
      });
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 8,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: Omit<BillingPageProps, 'createSubscriptionModalProps'> = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: true,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: false,
        currentTier: 'high',
        currentTierInterval: 'monthly',
      },
      currentMonthlyRatePerUser: 50,
      currentPeriodEnd: new Date('2025-06-09T00:00:00.000Z'),
      currentSeats: 8,
      currentInterval: 'monthly',
      currentTier: 'high',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 400,
      subscriptionStatus: 'paused',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription still in free trial, should: flag isOnFreeTrial true', () => {
    const now = new Date('2025-01-10T00:00:00.000Z');
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      organization: createPopulatedOrganization({
        createdAt: new Date('2024-12-29T00:00:00.000Z'),
      }),
      memberCount: 2,
      stripeSubscriptions: [],
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });

    const expected: Omit<BillingPageProps, 'createSubscriptionModalProps'> = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: false,
        currentTier: 'high',
        currentTierInterval: 'monthly',
      },
      currentMonthlyRatePerUser: 85,
      currentPeriodEnd: organization.trialEnd,
      currentSeats: 2,
      currentInterval: 'monthly',
      currentTier: 'high',
      isEnterprisePlan: false,
      isOnFreeTrial: true,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 170,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription with a pending downgrade, should: return correct billing props', () => {
    const now = new Date('2025-06-15T00:00:00.000Z');
    const subscriptionId =
      createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct()
        .stripeId;
    const subscriptionScheduleId =
      createPopulatedStripeSubscriptionSchedule().stripeId;

    // 1) Start with a live, high-tier subscription
    const subscription = {
      ...createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
        {
          stripeId: subscriptionId,
          organizationId: 'org-789',
          cancelAtPeriodEnd: false,
          status: 'active',
          items: [
            {
              price: createPopulatedStripePriceWithProduct({
                lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
                unitAmount: 6000,
                product: { maxSeats: 25 },
                interval: StripePriceInterval.month,
              }),
              ...createPopulatedStripeSubscriptionItem({
                currentPeriodStart: new Date('2025-05-01T00:00:00.000Z'),
                currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
              }),
            },
          ],
        },
      ),
      schedule: createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
        // force the same IDs you generated above
        stripeId: subscriptionScheduleId,
        subscriptionId,

        // deep‐override exactly the two phases you care about
        phases: [
          {
            scheduleId: subscriptionScheduleId,
            startDate: new Date('2025-05-01T00:00:00.000Z'),
            endDate: new Date('2025-06-30T00:00:00.000Z'),
            price: {
              lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
              unitAmount: 6000,
            },
            quantity: 5,
          },
          {
            scheduleId: subscriptionScheduleId,
            startDate: new Date('2025-06-30T00:00:00.000Z'),
            endDate: new Date('2025-07-30T00:00:00.000Z'),
            price: {
              lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
              unitAmount: 2000,
            },
            quantity: 2,
          },
        ],
      }),
    };

    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 5,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: Omit<BillingPageProps, 'createSubscriptionModalProps'> = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: true,
        currentTier: 'high',
        currentTierInterval: 'monthly',
      },
      currentMonthlyRatePerUser: 60,
      currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
      currentSeats: 5,
      currentInterval: 'monthly',
      currentTier: 'high',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 300,
      subscriptionStatus: 'active',
      pendingChange: {
        pendingChangeDate: new Date('2025-06-30T00:00:00.000Z'),
        pendingInterval: 'monthly',
        pendingTier: 'low',
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe('extractBaseUrl()', () => {
  test('given: a request URL, should: return the base URL', () => {
    const url = new URL('https://example.com/some/path?query=param');

    const actual = extractBaseUrl(url);
    const expected = 'http://example.com';

    expect(actual).toEqual(expected);
  });
});

describe('getCreateSubscriptionModalProps()', () => {
  test('should compute modal props from org and products', () => {
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      memberCount: 3,
      stripeSubscriptions: [],
    });
    const products = [
      createStripeProductWithPrices({ maxSeats: 1 }),
      createStripeProductWithPrices({ maxSeats: 10 }),
      createStripeProductWithPrices({ maxSeats: 25 }),
    ];

    const actual = getCreateSubscriptionModalProps(organization, products);
    expect(actual).toEqual({
      createSubscriptionModalProps: {
        currentSeats: 3,
        planLimits: { low: 1, mid: 10, high: 25 },
      },
    });
  });

  test('should handle empty products', () => {
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      memberCount: 2,
      stripeSubscriptions: [],
    });
    const products: ProductsForBillingPage = [];

    const actual = getCreateSubscriptionModalProps(organization, products);
    expect(actual).toEqual({
      createSubscriptionModalProps: {
        currentSeats: 2,
        planLimits: { low: 0, mid: 0, high: 0 },
      },
    });
  });
});
