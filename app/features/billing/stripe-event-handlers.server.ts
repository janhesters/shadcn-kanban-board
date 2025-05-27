import type { Stripe } from 'stripe';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';
import { getErrorMessage } from '~/utils/get-error-message';

import { updateOrganizationInDatabaseById } from '../organizations/organizations-model.server';
import { updateStripeCustomer } from './stripe-helpers.server';
import {
  deleteStripePriceFromDatabaseById,
  saveStripePriceFromAPIToDatabase,
  updateStripePriceFromAPIInDatabase,
} from './stripe-prices-model.server';
import {
  deleteStripeProductFromDatabaseById,
  saveStripeProductFromAPIToDatabase,
  updateStripeProductFromAPIInDatabase,
} from './stripe-product-model.server';
import {
  createStripeSubscriptionInDatabase,
  updateStripeSubscriptionFromAPIInDatabase,
} from './stripe-subscription-model.server';
import {
  saveStripeSubscriptionScheduleFromAPIToDatabase,
  updateStripeSubscriptionScheduleFromAPIInDatabase,
} from './stripe-subscription-schedule-model.server';

const ok = () =>
  new Response(JSON.stringify({ message: 'OK' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const prettyPrint = (event: Stripe.Event) => {
  console.log(
    `unhandled Stripe event: ${event.type}`,
    process.env.NODE_ENV === 'development'
      ? // eslint-disable-next-line unicorn/no-null
        JSON.stringify(event, null, 2)
      : 'event not logged in production mode - look it up in the Stripe Dashboard',
  );
};

export const handleStripeChargeDisputeClosedEvent = async (
  event: Stripe.ChargeDisputeClosedEvent,
) => {
  const dispute = event.data.object;

  // only cancel if the dispute was lost (cardholder won)
  if (dispute.status !== 'lost') {
    return ok();
  }

  try {
    // normalize dispute.charge → string ID
    const chargeId =
      typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;

    // fetch the Charge
    const charge = await stripeAdmin.charges.retrieve(chargeId);

    // extract customer ID
    const customerId =
      typeof charge.customer === 'string'
        ? charge.customer
        : charge.customer?.id;
    if (!customerId) {
      console.log('No customer associated with charge', charge.id);
      return ok();
    }

    // list active subscriptions for that customer
    const subsList = await stripeAdmin.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1, // just need one
    });

    if (subsList.data.length === 0) {
      console.log(`No active subscriptions for customer ${customerId}`);
      return ok();
    }

    // cancel the first one (or adjust logic if you need something more nuanced)
    const cancelled = await stripeAdmin.subscriptions.cancel(
      subsList.data[0].id,
    );

    console.log(
      'Automatically cancelled subscription due to lost dispute:',
      cancelled.id,
    );
  } catch (error) {
    prettyPrint(event);
    console.error(
      'Error cancelling subscription on dispute.closed',
      getErrorMessage(error),
    );
  }

  return ok();
};

export const handleStripeCheckoutSessionCompletedEvent = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  try {
    if (event.data.object.metadata?.organizationId) {
      const organization = await updateOrganizationInDatabaseById({
        id: event.data.object.metadata.organizationId,
        organization: {
          ...(event.data.object.customer_details?.email && {
            billingEmail: event.data.object.customer_details.email,
          }),
          ...(typeof event.data.object.customer === 'string' && {
            stripeCustomerId: event.data.object.customer,
          }),
          // End the trial now.
          trialEnd: new Date(),
        },
      });

      if (typeof event.data.object.customer === 'string') {
        await updateStripeCustomer({
          customerId: event.data.object.customer,
          customerName: organization.name,
          organizationId: organization.id,
        });
      }
    } else {
      console.error('No organization ID found in checkout session metadata');
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error(
      'Error handling Stripe checkout session completed event',
      message,
    );
  }

  return ok();
};

export const handleStripeCustomerDeletedEvent = async (
  event: Stripe.CustomerDeletedEvent,
) => {
  try {
    if (event.data.object.metadata?.organizationId) {
      await updateOrganizationInDatabaseById({
        id: event.data.object.metadata.organizationId,
        // eslint-disable-next-line unicorn/no-null
        organization: { stripeCustomerId: null },
      });
    } else {
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error handling Stripe customer deleted event', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionCreatedEvent = async (
  event: Stripe.CustomerSubscriptionCreatedEvent,
) => {
  try {
    await createStripeSubscriptionInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error creating Stripe subscription', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionDeletedEvent = async (
  event: Stripe.CustomerSubscriptionDeletedEvent,
) => {
  try {
    await updateStripeSubscriptionFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating deleted Stripe subscription', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionUpdatedEvent = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  try {
    await updateStripeSubscriptionFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating Stripe subscription', message);
  }

  return ok();
};

export const handleStripePriceCreatedEvent = async (
  event: Stripe.PriceCreatedEvent,
) => {
  try {
    await saveStripePriceFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error creating Stripe price', message);
  }

  return ok();
};

export const handleStripePriceDeletedEvent = async (
  event: Stripe.PriceDeletedEvent,
) => {
  try {
    await deleteStripePriceFromDatabaseById(event.data.object.id);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error deleting Stripe price', message);
  }

  return ok();
};

export const handleStripePriceUpdatedEvent = async (
  event: Stripe.PriceUpdatedEvent,
) => {
  try {
    await updateStripePriceFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating Stripe price', message);
  }

  return ok();
};

export const handleStripeProductCreatedEvent = async (
  event: Stripe.ProductCreatedEvent,
) => {
  try {
    await saveStripeProductFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error creating Stripe product', message);
  }

  return ok();
};

export const handleStripeProductDeletedEvent = async (
  event: Stripe.ProductDeletedEvent,
) => {
  try {
    await deleteStripeProductFromDatabaseById(event.data.object.id);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error deleting Stripe product', message);
  }

  return ok();
};

export const handleStripeProductUpdatedEvent = async (
  event: Stripe.ProductUpdatedEvent,
) => {
  try {
    await updateStripeProductFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating Stripe product', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleCreatedEvent = async (
  event: Stripe.SubscriptionScheduleCreatedEvent,
) => {
  try {
    await saveStripeSubscriptionScheduleFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error creating Stripe subscription schedule', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleExpiringEvent = async (
  event: Stripe.SubscriptionScheduleExpiringEvent,
) => {
  try {
    await updateStripeSubscriptionScheduleFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating Stripe subscription schedule', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleUpdatedEvent = async (
  event: Stripe.SubscriptionScheduleUpdatedEvent,
) => {
  try {
    await updateStripeSubscriptionScheduleFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error updating Stripe subscription schedule', message);
  }

  return ok();
};
