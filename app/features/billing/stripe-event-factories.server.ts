/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Stripe } from 'stripe';

import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '../user-accounts/user-accounts-factories.server';
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripePriceFactory,
  createStripeProductFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from './stripe-factories.server';

/**
 * Base factory for all Stripe.Event fields _except_ `data` & `type`.
 */
export const createStripeEventFactory: Factory<
  Omit<Stripe.Event, 'data' | 'type'>
> = ({
  id = `evt_${createId()}`,
  object = 'event',
  api_version = '2025-04-30.basil',
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  livemode = false,
  pending_webhooks = faker.number.int({ min: 1, max: 5 }),
  request = {
    id: null,
    idempotency_key: faker.string.uuid(),
  },
} = {}) => ({
  id,
  object,
  api_version,
  created,
  livemode,
  pending_webhooks,
  request,
});

export const createStripeCheckoutSessionCompletedEventFactory: Factory<
  Stripe.CheckoutSessionCompletedEvent
> = ({
  data = { object: createStripeCheckoutSessionFactory() },
  type = 'checkout.session.completed',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerDeletedEventFactory: Factory<
  Stripe.CustomerDeletedEvent
> = ({
  data = { object: createStripeCustomerFactory() },
  type = 'customer.deleted',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionCreatedEventFactory: Factory<
  Stripe.CustomerSubscriptionCreatedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      automatic_tax: {
        enabled: true,
        liability: { type: 'self' as const },
        disabled_reason: null,
      },
      default_payment_method: `pm_${createId()}`,
      payment_settings: {
        payment_method_options: {
          acss_debit: null,
          bancontact: null,
          card: {
            network: null,
            request_three_d_secure: 'automatic' as const,
          },
          customer_balance: null,
          konbini: null,
          sepa_debit: null,
          us_bank_account: null,
        },
        payment_method_types: null,
        save_default_payment_method:
          'off' as Stripe.Subscription.PaymentSettings.SaveDefaultPaymentMethod,
      },
      metadata: {
        organizationSlug: createPopulatedOrganization().slug,
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
    }),
  },
  type = 'customer.subscription.created',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionDeletedEventFactory: Factory<
  Stripe.CustomerSubscriptionDeletedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      ended_at: Math.floor(Date.now() / 1000),
      metadata: {
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
    }),
  },
  type = 'customer.subscription.deleted',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionUpdatedEventFactory: Factory<
  Stripe.CustomerSubscriptionUpdatedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      metadata: {
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
    }),
  },
  type = 'customer.subscription.updated',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleCreatedEventFactory: Factory<
  Stripe.SubscriptionScheduleCreatedEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = 'subscription_schedule.created',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceCreatedEventFactory: Factory<
  Stripe.PriceCreatedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = 'price.created',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceDeletedEventFactory: Factory<
  Stripe.PriceDeletedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = 'price.deleted',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceUpdatedEventFactory: Factory<
  Stripe.PriceUpdatedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = 'price.updated',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductCreatedEventFactory: Factory<
  Stripe.ProductCreatedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = 'product.created',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductDeletedEventFactory: Factory<
  Stripe.ProductDeletedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = 'product.deleted',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductUpdatedEventFactory: Factory<
  Stripe.ProductUpdatedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = 'product.updated',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleExpiringEventFactory: Factory<
  Stripe.SubscriptionScheduleExpiringEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = 'subscription_schedule.expiring',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleUpdatedEventFactory: Factory<
  Stripe.SubscriptionScheduleUpdatedEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = 'subscription_schedule.updated',
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });
