import invariant from 'tiny-invariant';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';
import {
  handleStripeChargeDisputeClosedEvent,
  handleStripeCheckoutSessionCompletedEvent,
  handleStripeCustomerDeletedEvent,
  handleStripeCustomerSubscriptionCreatedEvent,
  handleStripeCustomerSubscriptionDeletedEvent,
  handleStripeCustomerSubscriptionUpdatedEvent,
  handleStripePriceCreatedEvent,
  handleStripePriceDeletedEvent,
  handleStripePriceUpdatedEvent,
  handleStripeProductCreatedEvent,
  handleStripeProductDeletedEvent,
  handleStripeProductUpdatedEvent,
  handleStripeSubscriptionScheduleCreatedEvent,
  handleStripeSubscriptionScheduleExpiringEvent,
  handleStripeSubscriptionScheduleUpdatedEvent,
} from '~/features/billing/stripe-event-handlers.server';
import { getErrorMessage } from '~/utils/get-error-message';

import type { Route } from './+types/stripe.webhooks';

const json = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const notAllowed = () =>
  json({ message: 'Method Not Allowed' }, { status: 405 });

const badRequest = (payload?: { message?: string; error?: string }) =>
  json({ message: 'Bad Request', ...payload }, { status: 400 });

export const loader = () => notAllowed();

export async function action({ request }: Route.ActionArgs) {
  const method = request.method;

  if (method !== 'POST') {
    return notAllowed();
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return badRequest({ message: 'Missing stripe-signature header' });
  }

  invariant(
    process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET environment variable is not set',
  );

  const payload = await request.text();

  try {
    const event = stripeAdmin.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'charge.dispute.closed': {
        return handleStripeChargeDisputeClosedEvent(event);
      }
      case 'checkout.session.completed': {
        return handleStripeCheckoutSessionCompletedEvent(event);
      }
      case 'customer.deleted': {
        return handleStripeCustomerDeletedEvent(event);
      }
      case 'customer.subscription.created': {
        return handleStripeCustomerSubscriptionCreatedEvent(event);
      }
      case 'customer.subscription.deleted': {
        return handleStripeCustomerSubscriptionDeletedEvent(event);
      }
      case 'customer.subscription.updated': {
        return handleStripeCustomerSubscriptionUpdatedEvent(event);
      }
      case 'price.created': {
        return handleStripePriceCreatedEvent(event);
      }
      case 'price.deleted': {
        return handleStripePriceDeletedEvent(event);
      }
      case 'price.updated': {
        return handleStripePriceUpdatedEvent(event);
      }
      case 'product.created': {
        return handleStripeProductCreatedEvent(event);
      }
      case 'product.deleted': {
        return handleStripeProductDeletedEvent(event);
      }
      case 'product.updated': {
        return handleStripeProductUpdatedEvent(event);
      }
      case 'subscription_schedule.created': {
        return handleStripeSubscriptionScheduleCreatedEvent(event);
      }
      case 'subscription_schedule.expiring': {
        return handleStripeSubscriptionScheduleExpiringEvent(event);
      }
      case 'subscription_schedule.updated': {
        return handleStripeSubscriptionScheduleUpdatedEvent(event);
      }
      case 'billing_portal.configuration.updated':
      case 'billing_portal.session.created':
      case 'charge.dispute.created':
      case 'charge.dispute.funds_withdrawn':
      case 'charge.succeeded':
      case 'customer.created':
      case 'customer.updated':
      case 'invoice.marked_uncollectible':
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.upcoming':
      case 'invoice.updated':
      case 'invoiceitem.created':
      case 'payment_intent.created':
      case 'payment_intent.succeeded':
      case 'payment_method.attached':
      case 'plan.created':
      case 'plan.deleted':
      case 'plan.updated':
      case 'setup_intent.created':
      case 'subscription_schedule.released':
      case 'test_helpers.test_clock.advancing':
      case 'test_helpers.test_clock.ready': {
        return json({ message: 'OK' });
      }
      default: {
        console.log('Stripe webhook unhandled event type:', event.type);
        console.log(
          'Stripe webhook payload:',
          // eslint-disable-next-line unicorn/no-null
          JSON.stringify(payload, null, 2),
        );

        return json({ message: `Unhandled event type: ${event.type}` });
      }
    }
  } catch (error) {
    return badRequest({ error: `Webhook Error: ${getErrorMessage(error)}` });
  }
}
