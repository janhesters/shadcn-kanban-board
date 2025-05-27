export const CANCEL_SUBSCRIPTION_INTENT = 'cancelSubscription';
export const KEEP_CURRENT_SUBSCRIPTION_INTENT = 'keepCurrentSubscription';
export const OPEN_CHECKOUT_SESSION_INTENT = 'openCheckoutSession';
export const RESUME_SUBSCRIPTION_INTENT = 'resumeSubscription';
export const SWITCH_SUBSCRIPTION_INTENT = 'switchSubscription';
export const UPDATE_BILLING_EMAIL_INTENT = 'updateBillingEmail';
export const VIEW_INVOICES_INTENT = 'viewInvoices';

export const priceLookupKeysByTierAndInterval = {
  low: {
    monthly: 'monthly_hobby_plan',
    annual: 'annual_hobby_plan',
  },
  mid: {
    monthly: 'monthly_startup_plan',
    annual: 'annual_startup_plan',
  },
  high: {
    monthly: 'monthly_business_plan',
    annual: 'annual_business_plan',
  },
} as const;

export type Tier = keyof typeof priceLookupKeysByTierAndInterval;
export type Interval = keyof (typeof priceLookupKeysByTierAndInterval)[Tier];

export const monthlyLookupKeys = [
  priceLookupKeysByTierAndInterval.low.monthly,
  priceLookupKeysByTierAndInterval.mid.monthly,
  priceLookupKeysByTierAndInterval.high.monthly,
] as const;

export const annualLookupKeys = [
  priceLookupKeysByTierAndInterval.low.annual,
  priceLookupKeysByTierAndInterval.mid.annual,
  priceLookupKeysByTierAndInterval.high.annual,
] as const;

export const allLookupKeys = [
  ...monthlyLookupKeys,
  ...annualLookupKeys,
] as const;

export type LookupKey = (typeof allLookupKeys)[number];

export const allTiers = ['low', 'mid', 'high'] as const;
