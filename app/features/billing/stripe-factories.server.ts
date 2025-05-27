/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Stripe } from 'stripe';

import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '../user-accounts/user-accounts-factories.server';

/**
 * Creates a Stripe Product object with populated values.
 */
export const createStripeProductFactory: Factory<Stripe.Product> = ({
  id = `prod_${createId()}`,
  object = 'product',
  active = true,
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  default_price = null,
  description = null,
  images = [],
  livemode = false,
  marketing_features = [],
  metadata = {
    max_seats: '1',
  },
  name = 'Hobby Plan',
  package_dimensions = null,
  shippable = null,
  statement_descriptor = null,
  tax_code = 'txcd_10103001',
  type = 'service',
  unit_label = 'seat',
  updated = created,
  url = null,
} = {}) => ({
  id,
  object,
  active,
  created,
  default_price,
  description,
  images,
  livemode,
  marketing_features,
  metadata,
  name,
  package_dimensions,
  shippable,
  statement_descriptor,
  tax_code,
  type,
  unit_label,
  updated,
  url,
});

/**
 * Creates a Stripe Customer object with populated values.
 */
export const createStripeCustomerFactory: Factory<Stripe.Customer> = ({
  id = `cus_${createId()}`,
  object = 'customer',
  address = null,
  balance = 0,
  // realistic created timestamp within last 10 days
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  currency = null,
  default_source = null,
  delinquent = false,
  description = null,
  email = faker.internet.email(),
  invoice_prefix = faker.string.alphanumeric(8).toUpperCase(),
  invoice_settings = {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null,
  },
  livemode = false,
  metadata = {},
  name = faker.person.fullName(),
  next_invoice_sequence = faker.number.int({ min: 1, max: 10 }),
  phone = null,
  preferred_locales = [],
  shipping = null,
  tax_exempt = 'none',
  test_clock = null,
} = {}) => ({
  id,
  object,
  address,
  balance,
  created,
  currency,
  default_source,
  delinquent,
  description,
  email,
  invoice_prefix,
  invoice_settings,
  livemode,
  metadata,
  name,
  next_invoice_sequence,
  phone,
  preferred_locales,
  shipping,
  tax_exempt,
  test_clock,
});

/**
 * Creates a Stripe Customer Portal Session object with populated values.
 */
export const createStripeCustomerPortalSessionFactory: Factory<
  Stripe.BillingPortal.Session
> = ({
  id = `bps_${createId()}`,
  object = 'billing_portal.session',
  configuration = `bpc_${createId()}`,
  // realistic created timestamp within last 10 days
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  customer = createStripeCustomerFactory().id,
  flow = null,
  livemode = false,
  locale = null,
  on_behalf_of = null,
  // default to a random URL, overrideable in tests
  return_url = faker.internet.url(),
  // Stripe-hosted portal URL
  url = `https://billing.stripe.com/p/session/test_${createId()}`,
} = {}) => ({
  id,
  object,
  configuration,
  created,
  customer,
  flow,
  livemode,
  locale,
  on_behalf_of,
  return_url,
  url,
});

/**
 * Creates a Stripe Price object with populated values.
 */
export const createStripePriceFactory: Factory<Stripe.Price> = ({
  lookup_key = `${faker.word.noun()}-${faker.word.noun()}-${faker.word.noun()}`,
  id = `price_${createId()}`,
  object = 'price',
  active = true,
  billing_scheme = 'per_unit',
  // realistic creation within last month
  created = Math.floor(faker.date.past().getTime() / 1000),
  currency = 'usd',
  custom_unit_amount = null,
  livemode = false,
  metadata = {},
  nickname = null,
  product = `prod_${createId()}`,
  recurring = {
    interval: faker.helpers.arrayElement([
      'month',
      'year',
    ]) as Stripe.Price.Recurring.Interval,
    interval_count: 1,
    trial_period_days: null,
    usage_type: 'licensed' as Stripe.Price.Recurring.UsageType,
    meter: null,
  },
  tax_behavior = 'unspecified',
  tiers_mode = null,
  transform_quantity = null,
  type = 'recurring',
  unit_amount = faker.number.int({ min: 500, max: 5000, multipleOf: 100 }),
  unit_amount_decimal = String(
    faker.number.int({ min: 500, max: 5000, multipleOf: 100 }),
  ),
} = {}) => ({
  id,
  object,
  active,
  billing_scheme,
  created,
  currency,
  custom_unit_amount,
  livemode,
  lookup_key,
  metadata,
  nickname,
  product,
  recurring,
  tax_behavior,
  tiers_mode,
  transform_quantity,
  type,
  unit_amount,
  unit_amount_decimal,
});

/**
 * Creates a Stripe SubscriptionItem object with populated values.
 */
export const createStripeSubscriptionItemFactory: Factory<
  Stripe.SubscriptionItem
> = ({
  id = `si_${createId()}`,
  object = 'subscription_item',
  // realistic created within last 5 days
  created = Math.floor(faker.date.recent({ days: 5 }).getTime() / 1000),
  discounts = [],
  metadata = {},
  plan = {} as Stripe.Plan, // deprecated in favor of price
  price = createStripePriceFactory(),
  quantity = faker.number.int({ min: 1, max: 5 }),
  subscription = `sub_${createId()}`,
  current_period_start = created,
  // realistic period end ~30 days after start
  current_period_end = Math.floor(
    faker.date.soon({ days: 30, refDate: new Date(created * 1000) }).getTime() /
      1000,
  ),
  tax_rates = [],
} = {}) => ({
  id,
  object,
  created,
  discounts,
  metadata,
  plan,
  price,
  quantity,
  subscription,
  current_period_start,
  current_period_end,
  tax_rates,
});

/**
 * Creates a Stripe Subscription object with populated values.
 */
export const createStripeSubscriptionFactory: Factory<Stripe.Subscription> = ({
  id = `sub_${createId()}`,
  object = 'subscription',
  application = null,
  application_fee_percent = null,
  automatic_tax = { enabled: false, liability: null, disabled_reason: null },
  // realistic dates: created and cycle anchor within last week
  created = Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
  billing_cycle_anchor = created,
  billing_cycle_anchor_config = null,
  cancel_at = null,
  cancel_at_period_end = false,
  canceled_at = null,
  cancellation_details = { comment: null, feedback: null, reason: null },
  collection_method = 'charge_automatically',
  currency = 'usd',
  customer = createStripeCustomerFactory().id,
  days_until_due = null,
  default_payment_method = null,
  default_source = null,
  default_tax_rates = [],
  description = null,
  discounts = [],
  ended_at = null,
  invoice_settings = {
    account_tax_ids: null,
    issuer: { type: 'self' as Stripe.Invoice.Issuer.Type },
  },
  items: itemsParameter,
  latest_invoice = `in_${createId()}`,
  livemode = false,
  metadata = {},
  next_pending_invoice_item_invoice = null,
  on_behalf_of = null,
  pause_collection = null,
  payment_settings = {
    payment_method_options: null,
    payment_method_types: null,
    save_default_payment_method:
      'off' as Stripe.Subscription.PaymentSettings.SaveDefaultPaymentMethod,
  },
  pending_invoice_item_interval = null,
  pending_setup_intent = null,
  pending_update = null,
  schedule = null,
  start_date = created,
  status = 'active',
  test_clock = null,
  transfer_data = null,
  trial_end = null,
  trial_settings = {
    end_behavior: {
      missing_payment_method:
        'create_invoice' as Stripe.Subscription.TrialSettings.EndBehavior.MissingPaymentMethod,
    },
  },
  trial_start = null,
} = {}) => {
  const defaultItem = createStripeSubscriptionItemFactory({
    subscription: id,
    // align periods with subscription dates
    created,
    current_period_start: created,
  });
  const items = itemsParameter ?? {
    object: 'list',
    data: [defaultItem],
    has_more: false,
    total_count: 1,
    url: `/v1/subscription_items?subscription=${id}`,
  };

  return {
    id,
    object,
    application,
    application_fee_percent,
    automatic_tax,
    billing_cycle_anchor,
    billing_cycle_anchor_config,
    cancel_at,
    cancel_at_period_end,
    canceled_at,
    cancellation_details,
    collection_method,
    created,
    currency,
    customer,
    days_until_due,
    default_payment_method,
    default_source,
    default_tax_rates,
    description,
    discounts,
    ended_at,
    invoice_settings,
    items,
    latest_invoice,
    livemode,
    metadata,
    next_pending_invoice_item_invoice,
    on_behalf_of,
    pause_collection,
    payment_settings,
    pending_invoice_item_interval,
    pending_setup_intent,
    pending_update,
    schedule,
    start_date,
    status,
    test_clock,
    transfer_data,
    trial_end,
    trial_settings,
    trial_start,
  };
};

/**
 * Creates a Stripe Checkout Session object with populated values.
 */
export const createStripeCheckoutSessionFactory: Factory<
  Stripe.Checkout.Session
> = ({
  id = `cs_${createId()}`,
  object = 'checkout.session',
  adaptive_pricing = null,
  after_expiration = null,
  allow_promotion_codes = null,
  amount_subtotal = faker.number.int({ min: 1000, max: 100_000 }),
  amount_total = amount_subtotal,
  automatic_tax = {
    enabled: true,
    liability: { type: 'self' as const },
    provider: 'stripe' as const,
    status: 'complete' as const,
  },
  billing_address_collection = 'auto',
  cancel_url = faker.internet.url(),
  client_reference_id = null,
  client_secret = null,
  collected_information = { shipping_details: null },
  consent = null,
  consent_collection = null,
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  currency = 'usd',
  currency_conversion = null,
  custom_fields = [],
  custom_text = {
    after_submit: null,
    shipping_address: null,
    submit: null,
    terms_of_service_acceptance: null,
  },
  customer = createStripeCustomerFactory().id,
  customer_creation = 'always',
  customer_details = {
    address: {
      city: null,
      country: 'CH',
      line1: null,
      line2: null,
      postal_code: null,
      state: null,
    },
    email: faker.internet.email(),
    name: faker.person.fullName(),
    phone: null,
    tax_exempt: 'none' as Stripe.Checkout.Session.CustomerDetails.TaxExempt,
    tax_ids: [],
  },
  customer_email = null,
  discounts = [],
  expires_at = created + 86_400, // 24 hours from creation
  invoice = `in_${createId()}`,
  invoice_creation = null,
  livemode = false,
  locale = null,
  metadata = {
    organizationSlug: createPopulatedOrganization().slug,
    organizationId: createPopulatedOrganization().id,
    purchasedById: createPopulatedUserAccount().email,
    customerEmail: createPopulatedOrganization().billingEmail,
  },
  mode = 'subscription',
  payment_intent = null,
  payment_link = null,
  payment_method_collection = 'always',
  payment_method_configuration_details = {
    id: `pmc_${createId()}`,
    parent: null,
  },
  payment_method_options = {
    card: {
      request_three_d_secure: 'automatic' as const,
    },
  },
  payment_method_types = ['card', 'link'],
  payment_status = 'paid',
  permissions = null,
  phone_number_collection = {
    enabled: false,
  },
  recovered_from = null,
  saved_payment_method_options = {
    allow_redisplay_filters: [
      'always',
    ] as Stripe.Checkout.Session.SavedPaymentMethodOptions.AllowRedisplayFilter[],
    payment_method_remove: null,
    payment_method_save: 'enabled' as const,
  },
  setup_intent = null,
  shipping_address_collection = null,
  shipping_cost = null,
  shipping_options = [],
  status = 'complete',
  submit_type = null,
  subscription = createStripeSubscriptionFactory().id,
  success_url = faker.internet.url(),
  total_details = {
    amount_discount: 0,
    amount_shipping: 0,
    amount_tax: 0,
  },
  ui_mode = 'hosted',
  url = `https://checkout.stripe.com/pay/${id}`,
  wallet_options = null,
} = {}) => ({
  id,
  object,
  adaptive_pricing,
  after_expiration,
  allow_promotion_codes,
  amount_subtotal,
  amount_total,
  automatic_tax,
  billing_address_collection,
  cancel_url,
  client_reference_id,
  client_secret,
  collected_information,
  consent,
  consent_collection,
  created,
  currency,
  currency_conversion,
  custom_fields,
  custom_text,
  customer,
  customer_creation,
  customer_details,
  customer_email,
  discounts,
  expires_at,
  invoice,
  invoice_creation,
  livemode,
  locale,
  metadata,
  mode,
  payment_intent,
  payment_link,
  payment_method_collection,
  payment_method_configuration_details,
  payment_method_options,
  payment_method_types,
  payment_status,
  permissions,
  phone_number_collection,
  recovered_from,
  saved_payment_method_options,
  setup_intent,
  shipping_address_collection,
  shipping_cost,
  shipping_options,
  status,
  submit_type,
  subscription,
  success_url,
  total_details,
  ui_mode,
  url,
  wallet_options,
});

/**
 * Creates a Stripe SubscriptionSchedulePhase object with populated values.
 */
export const createStripeSubscriptionSchedulePhaseFactory: Factory<
  Stripe.SubscriptionSchedule.Phase
> = ({
  add_invoice_items = [],
  application_fee_percent = null,
  automatic_tax = {
    enabled: true,
    liability: { type: 'self' as const },
    disabled_reason: null,
  },
  billing_cycle_anchor = null,
  collection_method = null,
  currency = 'usd',
  default_payment_method = null,
  default_tax_rates = [],
  description = null,
  discounts = [],
  end_date = Math.floor(faker.date.future().getTime() / 1000),
  invoice_settings = null,
  items = [
    {
      discounts: [],
      metadata: {},
      plan: `price_${createId()}`,
      price: `price_${createId()}`,
      quantity: 1,
      tax_rates: [],
    },
  ],
  metadata = {},
  on_behalf_of = null,
  proration_behavior = 'create_prorations' as const,
  start_date = Math.floor(faker.date.recent().getTime() / 1000),
  transfer_data = null,
  trial_end = null,
} = {}) => ({
  add_invoice_items,
  application_fee_percent,
  automatic_tax,
  billing_cycle_anchor,
  collection_method,
  currency,
  default_payment_method,
  default_tax_rates,
  description,
  discounts,
  end_date,
  invoice_settings,
  items,
  metadata,
  on_behalf_of,
  proration_behavior,
  start_date,
  transfer_data,
  trial_end,
});

/**
 * Creates a Stripe SubscriptionSchedule object with populated values.
 */
export const createStripeSubscriptionScheduleFactory: Factory<
  Stripe.SubscriptionSchedule
> = ({
  id = `sub_sched_${createId()}`,
  object = 'subscription_schedule' as const,
  application = null,
  canceled_at = null,
  completed_at = null,
  created = Math.floor(faker.date.recent().getTime() / 1000),
  current_phase = {
    end_date: Math.floor(faker.date.future().getTime() / 1000),
    start_date: Math.floor(faker.date.recent().getTime() / 1000),
  },
  customer = createStripeCustomerFactory().id,
  default_settings = {
    application_fee_percent: null,
    automatic_tax: {
      disabled_reason: null,
      enabled: true,
      liability: {
        type: 'self' as const,
      },
    },
    billing_cycle_anchor: 'automatic' as const,
    collection_method: 'charge_automatically' as const,
    default_payment_method: `pm_${createId()}`,
    default_source: null,
    description: null,
    invoice_settings: {
      account_tax_ids: null,
      days_until_due: null,
      issuer: {
        type: 'self' as const,
      },
    },
    on_behalf_of: null,
    transfer_data: null,
  },
  end_behavior = 'release' as const,
  livemode = false,
  metadata = {},
  phases = [createStripeSubscriptionSchedulePhaseFactory()],
  released_at = null,
  released_subscription = null,
  status = 'active' as const,
  subscription = createStripeSubscriptionFactory().id,
  test_clock = null,
} = {}) => ({
  id,
  object,
  application,
  canceled_at,
  completed_at,
  created,
  current_phase,
  customer,
  default_settings,
  end_behavior,
  livemode,
  metadata,
  phases,
  released_at,
  released_subscription,
  status,
  subscription,
  test_clock,
});
