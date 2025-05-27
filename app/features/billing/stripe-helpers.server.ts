import type { Organization, UserAccount } from '@prisma/client';
import { href } from 'react-router';
import type Stripe from 'stripe';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';

/**
 * Creates a Stripe Checkout Session for a subscription purchase or update.
 *
 * @param baseUrl - Your app's public URL (e.g., https://app.example.com).
 * @param customerEmail - The billing email for the customer/organization.
 * @param customerId - The Stripe customer ID, if already created; omit to
 * create a new customer.
 * @param organizationId - The Prisma ID of the organization.
 * @param organizationSlug - The slug of the organization for constructing
 * return URLs.
 * @param priceId - The Stripe Price ID to subscribe or update to.
 * @param purchasedById - The UserAccount ID of who initiated the purchase.
 * @param seatsUsed - Number of seats (quantity) to include in the subscription.
 * @returns A Promise that resolves to the Stripe Checkout Session.
 */
export async function createStripeCheckoutSession({
  baseUrl,
  customerEmail,
  customerId,
  organizationId,
  organizationSlug,
  priceId,
  purchasedById,
  seatsUsed,
}: {
  baseUrl: string;
  customerEmail: Organization['billingEmail'];
  customerId: Organization['stripeCustomerId'];
  organizationId: Organization['id'];
  organizationSlug: Organization['slug'];
  priceId: string;
  purchasedById: UserAccount['id'];
  seatsUsed: number;
}) {
  const hasCustomerId = customerId && customerId !== '';

  const session = await stripeAdmin.checkout.sessions.create({
    automatic_tax: { enabled: true },
    billing_address_collection: 'auto',
    cancel_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
    customer: hasCustomerId ? customerId : undefined,
    ...(hasCustomerId && {
      customer_update: { address: 'auto', name: 'auto', shipping: 'auto' },
    }),
    line_items: [{ price: priceId, quantity: seatsUsed }],
    metadata: {
      customerEmail,
      organizationId,
      organizationSlug,
      purchasedById,
    },
    mode: 'subscription',
    saved_payment_method_options: {
      payment_method_save: 'enabled',
    },
    subscription_data: {
      metadata: {
        customerEmail,
        organizationId,
        organizationSlug,
        purchasedById,
      },
    },
    success_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing/success',
      { organizationSlug },
    )}?session_id={CHECKOUT_SESSION_ID}`,
    // Show check box to allow purchasing as a business.
    tax_id_collection: { enabled: true },
  });

  return session;
}

/**
 * Creates a Stripe Customer Portal session for billing management.
 *
 * @param baseUrl - Your app's public URL.
 * @param customerId - The Stripe customer ID.
 * @param organizationSlug - The slug of the organization for return URL.
 * @returns A Promise that resolves to the Stripe Billing Portal Session.
 */
export async function createStripeCustomerPortalSession({
  baseUrl,
  customerId,
  organizationSlug,
}: {
  baseUrl: string;
  customerId: string;
  organizationSlug: string;
}) {
  const session = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
  });

  return session;
}

/**
 * Creates a Stripe Customer Portal session deep-linking to switch subscription
 * plans.
 *
 * @param baseUrl - Your app's public URL.
 * @param customerId - The Stripe customer ID.
 * @param organizationSlug - The organization slug for return URL.
 * @param subscriptionId - ID of the subscription to update.
 * @param subscriptionItemId - ID of the subscription item to change.
 * @param newPriceId - New Stripe Price ID for the subscription item.
 * @param quantity - The quantity for the updated subscription item.
 *   Must match existing quantity to preserve it.
 * @returns A Promise that resolves to the Stripe Billing Portal Session.
 */
export async function createStripeSwitchPlanSession({
  baseUrl,
  customerId,
  organizationSlug,
  subscriptionId,
  subscriptionItemId,
  newPriceId,
  quantity,
}: {
  baseUrl: string;
  customerId: string;
  organizationSlug: Organization['slug'];
  subscriptionId: string;
  subscriptionItemId: string;
  newPriceId: string;
  /** This MUST be the existing quantity of the subscription item, if you
   * want to preserve the quantity. Otherwise, Stripe will default to 1.
   */
  quantity: number;
}) {
  // This will deep-link straight to the "Confirm this update" page
  const session = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
    flow_data: {
      type: 'subscription_update_confirm',
      subscription_update_confirm: {
        subscription: subscriptionId,
        items: [{ id: subscriptionItemId, price: newPriceId, quantity }],
      },
    },
  });

  return session;
}

/**
 * Updates a Stripe customer's email, name, and/or metadata.
 *
 * @param customerId - The Stripe customer ID to update.
 * @param customerName - Optional new name for the customer.
 * @param customerEmail - Optional new email for the customer.
 * @param organizationId - Optional organization ID to store in metadata.
 * @returns A Promise that resolves to the updated Stripe Customer object.
 */
export async function updateStripeCustomer({
  customerId,
  customerName,
  customerEmail,
  organizationId,
}: {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  organizationId?: Organization['id'];
}) {
  const customer = await stripeAdmin.customers.update(customerId, {
    ...(customerEmail ? { email: customerEmail } : {}),
    ...(customerName ? { name: customerName } : {}),
    ...(organizationId ? { metadata: { organizationId } } : {}),
  });

  return customer;
}

/**
 * Creates a Stripe Customer Portal session deep-linking to cancel a
 * subscription.
 *
 * @param baseUrl - Your app's public URL.
 * @param customerId - The Stripe customer ID.
 * @param organizationSlug - The slug of the organization for return URL.
 * @param subscriptionId - The Stripe Subscription ID to cancel.
 * @returns A Promise that resolves to the Stripe Billing Portal Session.
 */
export async function createStripeCancelSubscriptionSession({
  baseUrl,
  customerId,
  organizationSlug,
  subscriptionId,
}: {
  /** Your app's public URL (e.g. https://app.example.com) */
  baseUrl: string;
  /** Stripe Customer ID */
  customerId: string;
  /** Org slug for building return_url path */
  organizationSlug: Organization['slug'];
  /** The Stripe Subscription ID you want to let them cancel */
  subscriptionId: string;
}) {
  const session = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
    flow_data: {
      // This invokes the "cancel subscription" deep-link
      type: 'subscription_cancel',
      subscription_cancel: {
        subscription: subscriptionId,
        // you can also configure a retention strategy here if desired:
        // retention: { type: 'coupon_offer', coupon: '25OFF' },
      },
    },
  });

  return session;
}

/**
 * Resumes a Stripe subscription if it's scheduled to cancel at period end.
 *
 * @param subscriptionId - The Stripe subscription ID to resume or retrieve.
 * @returns A Promise that resolves to the resumed or current Subscription.
 */
export async function resumeStripeSubscription(subscriptionId: string) {
  // 1) Retrieve current subscription
  const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId);

  // 2) If it's scheduled to cancel at period end, clear that flag
  if (subscription.cancel_at_period_end) {
    const renewed = await stripeAdmin.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return renewed;
  }

  // 3) Otherwise, it's already active/not scheduled to cancel
  return subscription;
}

/**
 * Releases a Stripe Subscription Schedule, keeping the current subscription
 * active.
 *
 * @param scheduleId - The ID of the SubscriptionSchedule to release.
 * @returns A Promise that resolves to the released SubscriptionSchedule.
 */
export async function keepCurrentSubscription(
  scheduleId: Stripe.SubscriptionSchedule['id'],
) {
  return await stripeAdmin.subscriptionSchedules.release(scheduleId);
}

/**
 * Adjusts the seat quantity of a Stripe subscription and updates future phases.
 *
 * @param subscriptionId - The Stripe subscription ID to update.
 * @param subscriptionItemId - The subscription item ID whose quantity should be
 * updated.
 * @param stripeScheduleId - Optional SubscriptionSchedule ID for future phases.
 * @param newQuantity - The new seat quantity to set.
 * @returns A Promise that resolves to an object with the updated subscription
 * and schedule.
 */
export async function adjustSeats({
  subscriptionId,
  subscriptionItemId,
  stripeScheduleId,
  newQuantity,
}: {
  subscriptionId: Stripe.Subscription['id'];
  subscriptionItemId: Stripe.SubscriptionItem['id'];
  stripeScheduleId?: Stripe.SubscriptionSchedule['id'];
  newQuantity: number;
}) {
  const updatedSub = await stripeAdmin.subscriptions.update(subscriptionId, {
    items: [{ id: subscriptionItemId, quantity: newQuantity }],
  });

  if (stripeScheduleId) {
    const sched =
      await stripeAdmin.subscriptionSchedules.retrieve(stripeScheduleId);

    const now = Math.floor(Date.now() / 1000);
    const updatedPhases = sched.phases.map(phase => ({
      start_date: phase.start_date,
      end_date: phase.end_date,
      items: phase.items.map(item => ({
        quantity:
          phase.start_date > now
            ? newQuantity // bump only future phases
            : item.quantity,
      })),
    }));

    const updatedSched = await stripeAdmin.subscriptionSchedules.update(
      stripeScheduleId,
      { phases: updatedPhases },
    );

    return { updatedSub, updatedSched };
  }

  return { updatedSub };
}

/**
 * Cancels all active subscriptions for a Stripe customer.
 *
 * @param customerId - The Stripe customer ID whose subscriptions to cancel.
 * @returns A Promise that resolves to an object containing cancelled subscriptions.
 */
export async function deactivateStripeCustomer(customerId: string) {
  const subscriptions = await stripeAdmin.subscriptions.list({
    customer: customerId,
    status: 'active',
  });

  const cancelledSubscriptions = [];

  for (const subscription of subscriptions.data) {
    const cancelled = await stripeAdmin.subscriptions.cancel(subscription.id);
    cancelledSubscriptions.push(cancelled);
  }

  return { cancelledSubscriptions };
}
