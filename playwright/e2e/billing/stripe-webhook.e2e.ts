/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { StripePriceInterval } from '@prisma/client';
import type Stripe from 'stripe';

import {
  createPopulatedStripePrice,
  createPopulatedStripeProduct,
  createPopulatedStripeSubscription,
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
} from '~/features/billing/billing-factories.server';
import { stripeAdmin } from '~/features/billing/stripe-admin.server';
import {
  createStripeCheckoutSessionCompletedEventFactory,
  createStripeCustomerDeletedEventFactory,
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionDeletedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
  createStripePriceCreatedEventFactory,
  createStripePriceDeletedEventFactory,
  createStripePriceUpdatedEventFactory,
  createStripeProductCreatedEventFactory,
  createStripeProductDeletedEventFactory,
  createStripeProductUpdatedEventFactory,
  createStripeSubscriptionScheduleCreatedEventFactory,
  createStripeSubscriptionScheduleExpiringEventFactory,
  createStripeSubscriptionScheduleUpdatedEventFactory,
} from '~/features/billing/stripe-event-factories.server';
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripePriceFactory,
  createStripeProductFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionItemFactory,
  createStripeSubscriptionScheduleFactory,
  createStripeSubscriptionSchedulePhaseFactory,
} from '~/features/billing/stripe-factories.server';
import {
  retrieveStripePriceFromDatabaseByLookupKey,
  saveStripePriceToDatabase,
} from '~/features/billing/stripe-prices-model.server';
import {
  deleteStripeProductFromDatabaseById,
  retrieveStripeProductFromDatabaseById,
  saveStripeProductToDatabase,
} from '~/features/billing/stripe-product-model.server';
import {
  createStripeSubscriptionInDatabase,
  retrieveStripeSubscriptionWithItemsFromDatabaseById,
  saveStripeSubscriptionToDatabase,
} from '~/features/billing/stripe-subscription-model.server';
import {
  retrieveStripeSubscriptionScheduleWithPhasesFromDatabaseById,
  saveSubscriptionScheduleWithPhasesAndPriceToDatabase,
} from '~/features/billing/stripe-subscription-schedule-model.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';

import { getJson } from '../../utils';

const path = '/api/v1/stripe/webhooks';

async function sendStripeWebhookRequest({
  event,
  request,
}: {
  event: Stripe.Event;
  request: APIRequestContext;
}) {
  const signatureHeader = stripeAdmin.webhooks.generateTestHeaderString({
    payload: JSON.stringify(event),
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });

  const response = await request.post(path, {
    headers: { 'stripe-signature': signatureHeader },
    data: JSON.stringify(event),
  });

  return response;
}

test.describe(`${path} API route`, () => {
  test('given: a GET request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.get(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test('given: a PUT request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.put(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test('given: a DELETE request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.delete(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test.describe('POST request', () => {
    test('given: no stripe signature header, should: return a 400', async ({
      request,
    }) => {
      const response = await request.post(path, { data: {} });

      expect(response.status()).toEqual(400);
      expect(await getJson(response)).toEqual({
        message: 'Missing stripe-signature header',
      });
    });

    test("given: a 'checkout.session.completed' event, should: update the organization with the billing email and the stripe customer id and end any ongoing trial", async ({
      request,
    }) => {
      const organization = createPopulatedOrganization({
        billingEmail: '',
        stripeCustomerId: null,
        createdAt: faker.date.recent({ days: 3 }),
      });
      await saveOrganizationToDatabase(organization);
      const newBillingEmail = faker.internet.email();
      const checkoutSession = createStripeCheckoutSessionFactory({
        customer_details: {
          email: newBillingEmail,
          address: null,
          name: null,
          phone: null,
          tax_exempt: null,
          tax_ids: null,
        },
        customer: faker.string.uuid(),
        metadata: {
          organizationId: organization.id,
        },
      });
      const event = createStripeCheckoutSessionCompletedEventFactory({
        data: { object: checkoutSession },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const updatedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(updatedOrganization!.billingEmail).toEqual(newBillingEmail);
      expect(updatedOrganization!.stripeCustomerId).toEqual(
        checkoutSession.customer,
      );
      expect(updatedOrganization!.trialEnd).not.toBeNull();

      await deleteOrganizationFromDatabaseById(organization.id);
    });

    test("given: a 'customer.deleted' event, should: clear the stripeCustomerId from the organization", async ({
      request,
    }) => {
      const stripeCustomerId = `cus_${faker.string.uuid()}`;
      const organization = createPopulatedOrganization({ stripeCustomerId });
      await saveOrganizationToDatabase(organization);
      const customer = createStripeCustomerFactory({
        id: stripeCustomerId,
        metadata: { organizationId: organization.id },
      });
      const event = createStripeCustomerDeletedEventFactory({
        data: { object: customer },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const updatedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(updatedOrganization!.stripeCustomerId).toBeNull();

      await deleteOrganizationFromDatabaseById(organization.id);
    });

    test("given: a 'customer.subscription.created' event, should: create a new subscription in the database", async ({
      request,
    }) => {
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);

      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);
      const subscriptionId = createStripeSubscriptionFactory().id;
      const subscription = createStripeSubscriptionFactory({
        id: subscriptionId,
        customer: organization.stripeCustomerId as unknown as Stripe.Customer,
        metadata: {
          organizationId: organization.id,
          purchasedById: user.id,
        },
        items: {
          object: 'list',
          data: [
            createStripeSubscriptionItemFactory({
              price: createStripePriceFactory({
                id: price.stripeId,
                unit_amount: price.unitAmount,
                currency: price.currency,
                product: product.stripeId,
                active: price.active,
                lookup_key: price.lookupKey,
              }),
              subscription: subscriptionId,
            }),
          ],
          has_more: false,
          url: `/v1/subscription_items?subscription=${subscriptionId}`,
        },
      });
      const event = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: subscription },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseSubscription =
        await retrieveStripeSubscriptionWithItemsFromDatabaseById(
          subscription.id,
        );
      expect(databaseSubscription).not.toBeNull();
      expect(databaseSubscription!.stripeId).toEqual(subscription.id);
      expect(databaseSubscription!.organizationId).toEqual(organization.id);
      expect(databaseSubscription!.purchasedById).toEqual(user.id);
      expect(databaseSubscription!.status).toEqual(subscription.status);
      expect(databaseSubscription!.items.length).toEqual(1);
      expect(databaseSubscription!.items[0].priceId).toEqual(price.stripeId);

      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'customer.subscription.deleted' event, should: update the subscription in the database (e.g., set status to canceled)", async ({
      request,
    }) => {
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization({
        stripeCustomerId: `cus_${faker.string.uuid()}`,
      });
      await saveOrganizationToDatabase(organization);
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);
      const subscriptionId = createStripeSubscriptionFactory().id;
      const initialSubscriptionData = createStripeSubscriptionFactory({
        id: subscriptionId,
        customer: organization.stripeCustomerId!,
        status: 'active',
        items: {
          object: 'list',
          data: [
            createStripeSubscriptionItemFactory({
              subscription: subscriptionId,
              price: createStripePriceFactory({
                id: price.stripeId,
                product: product.stripeId,
              }),
            }),
          ],
          has_more: false,
          url: `/v1/subscription_items?subscription=${subscriptionId}`,
        },
        metadata: { organizationId: organization.id, purchasedById: user.id },
      });
      await createStripeSubscriptionInDatabase(initialSubscriptionData);
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const deletedSubscriptionEventData = {
        ...initialSubscriptionData,
        status: 'canceled' as Stripe.Subscription.Status,
        canceled_at: nowInSeconds,
        ended_at: nowInSeconds,
      };
      const event = createStripeCustomerSubscriptionDeletedEventFactory({
        data: { object: deletedSubscriptionEventData },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseSubscription =
        await retrieveStripeSubscriptionWithItemsFromDatabaseById(
          initialSubscriptionData.id,
        );
      expect(databaseSubscription).not.toBeNull();
      expect(databaseSubscription!.status).toEqual('canceled');
      expect(databaseSubscription!.created.toISOString()).toEqual(
        new Date(initialSubscriptionData.created * 1000).toISOString(),
      );

      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'customer.subscription.updated' event, should: update the subscription in the database", async ({
      request,
    }) => {
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);
      const subscriptionId = createStripeSubscriptionFactory().id;
      const initialSubscriptionData = createStripeSubscriptionFactory({
        id: subscriptionId,
        customer: organization.stripeCustomerId!,
        status: 'active',
        items: {
          object: 'list',
          data: [
            createStripeSubscriptionItemFactory({
              subscription: subscriptionId,
              price: createStripePriceFactory({
                id: price.stripeId,
                product: product.stripeId,
              }),
            }),
          ],
          has_more: false,
          url: `/v1/subscription_items?subscription=${subscriptionId}`,
        },
        metadata: { organizationId: organization.id, purchasedById: user.id },
      });
      await createStripeSubscriptionInDatabase(initialSubscriptionData);

      const updatedSubscriptionData = {
        ...initialSubscriptionData,
        status: 'past_due' as Stripe.Subscription.Status,
        cancel_at_period_end: true,
      };
      const event = createStripeCustomerSubscriptionUpdatedEventFactory({
        data: { object: updatedSubscriptionData },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseSubscription =
        await retrieveStripeSubscriptionWithItemsFromDatabaseById(
          initialSubscriptionData.id,
        );
      expect(databaseSubscription).not.toBeNull();
      expect(databaseSubscription!.status).toEqual('past_due');
      expect(databaseSubscription!.cancelAtPeriodEnd).toEqual(true);
      expect(databaseSubscription!.created.toISOString()).toEqual(
        new Date(initialSubscriptionData.created * 1000).toISOString(),
      );

      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'price.created' event, should: create a new price in the database", async ({
      request,
    }) => {
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createStripePriceFactory({
        product: product.stripeId,
        lookup_key: 'test_price_key',
        unit_amount: 1000,
        currency: 'usd',
        active: true,
        recurring: {
          interval: 'month',
          interval_count: 1,
          trial_period_days: null,
          usage_type: 'licensed',
          meter: null,
        },
      });
      const event = createStripePriceCreatedEventFactory({
        data: { object: price },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databasePrice = await retrieveStripePriceFromDatabaseByLookupKey(
        price.lookup_key!,
      );
      expect(databasePrice).not.toBeNull();
      expect(databasePrice!.stripeId).toEqual(price.id);
      expect(databasePrice!.currency).toEqual(price.currency);
      expect(databasePrice!.unitAmount).toEqual(price.unit_amount);
      expect(databasePrice!.active).toEqual(price.active);
      expect(databasePrice!.interval).toEqual(price.recurring!.interval);
      expect(databasePrice!.productId).toEqual(product.stripeId);

      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'price.deleted' event, should: delete the price from the database", async ({
      request,
    }) => {
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);

      const event = createStripePriceDeletedEventFactory({
        data: { object: createStripePriceFactory({ id: price.stripeId }) },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databasePrice = await retrieveStripePriceFromDatabaseByLookupKey(
        price.lookupKey,
      );
      expect(databasePrice).toBeNull();

      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'price.updated' event, should: update the price in the database", async ({
      request,
    }) => {
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const initialPrice = createPopulatedStripePrice({
        productId: product.stripeId,
        currency: 'usd',
        unitAmount: 1000,
        active: true,
        interval: StripePriceInterval.month,
      });
      await saveStripePriceToDatabase(initialPrice);

      const updatedPriceData = createStripePriceFactory({
        id: initialPrice.stripeId,
        currency: 'eur',
        unit_amount: 2000,
        active: false,
        lookup_key: initialPrice.lookupKey,
        recurring: {
          interval: 'year',
          interval_count: 1,
          trial_period_days: null,
          usage_type: 'licensed',
          meter: null,
        },
        product: product.stripeId,
      });

      const event = createStripePriceUpdatedEventFactory({
        data: { object: updatedPriceData },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databasePrice = await retrieveStripePriceFromDatabaseByLookupKey(
        initialPrice.lookupKey,
      );
      expect(databasePrice).not.toBeNull();
      expect(databasePrice!.currency).toEqual(updatedPriceData.currency);
      expect(databasePrice!.unitAmount).toEqual(updatedPriceData.unit_amount);
      expect(databasePrice!.active).toEqual(updatedPriceData.active);
      expect(databasePrice!.interval).toEqual(
        updatedPriceData.recurring!.interval,
      );
      expect(databasePrice!.productId).toEqual(product.stripeId);

      await deleteStripeProductFromDatabaseById(product.stripeId);
    });

    test("given: a 'product.created' event, should: create a new product in the database", async ({
      request,
    }) => {
      const product = createStripeProductFactory({
        metadata: { max_seats: '5' },
        name: 'Pro Plan',
        active: true,
      });
      const event = createStripeProductCreatedEventFactory({
        data: { object: product },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseProduct = await retrieveStripeProductFromDatabaseById(
        product.id,
      );
      expect(databaseProduct).not.toBeNull();
      expect(databaseProduct!.stripeId).toEqual(product.id);
      expect(databaseProduct!.name).toEqual(product.name);
      expect(databaseProduct!.maxSeats).toEqual(5);
      expect(databaseProduct!.active).toEqual(product.active);

      await deleteStripeProductFromDatabaseById(product.id);
    });

    test("given: a 'product.deleted' event, should: delete the product from the database", async ({
      request,
    }) => {
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const event = createStripeProductDeletedEventFactory({
        data: { object: createStripeProductFactory({ id: product.stripeId }) },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseProduct = await retrieveStripeProductFromDatabaseById(
        product.stripeId,
      );
      expect(databaseProduct).toBeNull();
    });

    test("given: a 'product.updated' event, should: update the product in the database", async ({
      request,
    }) => {
      const initialProduct = createPopulatedStripeProduct({
        name: 'Initial Name',
        maxSeats: 5,
        active: true,
      });
      await saveStripeProductToDatabase(initialProduct);

      const updatedProductData = createStripeProductFactory({
        id: initialProduct.stripeId,
        name: 'Updated Name',
        metadata: { max_seats: '10' },
        active: false,
      });
      const event = createStripeProductUpdatedEventFactory({
        data: { object: updatedProductData },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseProduct = await retrieveStripeProductFromDatabaseById(
        initialProduct.stripeId,
      );
      expect(databaseProduct).not.toBeNull();
      expect(databaseProduct!.name).toEqual(updatedProductData.name);
      expect(databaseProduct!.maxSeats).toEqual(10);
      expect(databaseProduct!.active).toEqual(updatedProductData.active);

      await deleteStripeProductFromDatabaseById(initialProduct.stripeId);
    });

    test("given: a 'subscription_schedule.created' event, should: create a new subscription schedule in the database", async ({
      request,
    }) => {
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      const subscription = createPopulatedStripeSubscription({
        stripeId: `sub_${createId()}`,
        organizationId: organization.id,
        purchasedById: user.id,
        created: faker.date.past({ years: 1 }),
        cancelAtPeriodEnd: false,
        status: 'active',
      });
      await saveStripeSubscriptionToDatabase(subscription);
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);

      // Create the schedule with a phase using the price
      const scheduleData = createStripeSubscriptionScheduleFactory({
        subscription: subscription.stripeId,
        current_phase: {
          start_date: Math.floor(Date.now() / 1000),
          end_date: Math.floor(Date.now() / 1000) + 86_400, // 24 hours from now
        },
        phases: [
          createStripeSubscriptionSchedulePhaseFactory({
            items: [
              {
                price: price.stripeId,
                quantity: 1,
                tax_rates: [],
                metadata: {},
                discounts: [],
                plan: price.stripeId, // Required by Stripe API types
              },
            ],
          }),
        ],
      });
      const event = createStripeSubscriptionScheduleCreatedEventFactory({
        data: { object: scheduleData },
      });

      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      const databaseSchedule =
        await retrieveStripeSubscriptionScheduleWithPhasesFromDatabaseById(
          scheduleData.id,
        );
      expect(databaseSchedule).not.toBeNull();
      expect(databaseSchedule!.stripeId).toEqual(scheduleData.id);
      expect(databaseSchedule!.subscriptionId).toEqual(subscription.stripeId);
      expect(databaseSchedule!.created.getTime()).toEqual(
        scheduleData.created * 1000,
      );
      expect(databaseSchedule!.currentPhaseStart!.getTime()).toEqual(
        scheduleData.current_phase!.start_date * 1000,
      );
      expect(databaseSchedule!.currentPhaseEnd!.getTime()).toEqual(
        scheduleData.current_phase!.end_date * 1000,
      );
      expect(databaseSchedule!.phases.length).toEqual(1);
      expect(databaseSchedule!.phases[0].priceId).toEqual(price.stripeId);

      // Cleanup
      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
    });

    test("given: a 'subscription_schedule.expiring' event, should: update the subscription schedule in the database", async ({
      request,
    }) => {
      // Create base test data
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      const subscription = createPopulatedStripeSubscription({
        stripeId: `sub_${createId()}`,
        organizationId: organization.id,
        purchasedById: user.id,
        created: faker.date.past({ years: 1 }),
        cancelAtPeriodEnd: false,
        status: 'active',
      });
      await saveStripeSubscriptionToDatabase(subscription);
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);

      // Create initial schedule in database
      const initialSchedule =
        createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
          subscriptionId: subscription.stripeId,
          phases: [{ price }],
        });
      await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(
        initialSchedule,
      );

      // Create updated schedule data for the webhook event
      const updatedStartDate = Math.floor(Date.now() / 1000);
      const updatedEndDate = updatedStartDate + 86_400; // 24 hours from now
      const updatedScheduleData = createStripeSubscriptionScheduleFactory({
        id: initialSchedule.stripeId,
        subscription: subscription.stripeId,
        current_phase: {
          start_date: updatedStartDate,
          end_date: updatedEndDate,
        },
        phases: [
          createStripeSubscriptionSchedulePhaseFactory({
            start_date: updatedStartDate,
            end_date: updatedEndDate,
            items: [
              {
                price: price.stripeId,
                quantity: 2, // Changed quantity to verify update
                tax_rates: [],
                metadata: {},
                discounts: [],
                plan: price.stripeId,
              },
            ],
          }),
        ],
      });

      // Create and send the webhook event
      const event = createStripeSubscriptionScheduleExpiringEventFactory({
        data: { object: updatedScheduleData },
      });
      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      // Verify the schedule was updated
      const updatedSchedule =
        await retrieveStripeSubscriptionScheduleWithPhasesFromDatabaseById(
          initialSchedule.stripeId,
        );
      expect(updatedSchedule).not.toBeNull();
      expect(updatedSchedule!.stripeId).toEqual(initialSchedule.stripeId);
      expect(updatedSchedule!.subscriptionId).toEqual(subscription.stripeId);
      expect(updatedSchedule!.currentPhaseStart!.getTime()).toEqual(
        updatedStartDate * 1000,
      );
      expect(updatedSchedule!.currentPhaseEnd!.getTime()).toEqual(
        updatedEndDate * 1000,
      );
      expect(updatedSchedule!.phases.length).toEqual(1);
      expect(updatedSchedule!.phases[0].priceId).toEqual(price.stripeId);
      expect(updatedSchedule!.phases[0].quantity).toEqual(2);

      // Cleanup
      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
    });

    test("given: a 'subscription_schedule.updated' event, should: update the subscription schedule in the database", async ({
      request,
    }) => {
      // Create base test data
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      const subscription = createPopulatedStripeSubscription({
        stripeId: `sub_${createId()}`,
        organizationId: organization.id,
        purchasedById: user.id,
        created: faker.date.past({ years: 1 }),
        cancelAtPeriodEnd: false,
        status: 'active',
      });
      await saveStripeSubscriptionToDatabase(subscription);
      const product = createPopulatedStripeProduct();
      await saveStripeProductToDatabase(product);
      const price = createPopulatedStripePrice({ productId: product.stripeId });
      await saveStripePriceToDatabase(price);

      // Create initial schedule in database
      const initialSchedule =
        createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
          subscriptionId: subscription.stripeId,
          phases: [{ price }],
        });
      await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(
        initialSchedule,
      );

      // Create updated schedule data for the webhook event
      const updatedStartDate = Math.floor(Date.now() / 1000);
      const updatedEndDate = updatedStartDate + 86_400; // 24 hours from now
      const updatedScheduleData = createStripeSubscriptionScheduleFactory({
        id: initialSchedule.stripeId,
        subscription: subscription.stripeId,
        current_phase: {
          start_date: updatedStartDate,
          end_date: updatedEndDate,
        },
        phases: [
          createStripeSubscriptionSchedulePhaseFactory({
            start_date: updatedStartDate,
            end_date: updatedEndDate,
            items: [
              {
                price: price.stripeId,
                quantity: 2, // Changed quantity to verify update
                tax_rates: [],
                metadata: {},
                discounts: [],
                plan: price.stripeId,
              },
            ],
          }),
        ],
      });

      // Create and send the webhook event
      const event = createStripeSubscriptionScheduleUpdatedEventFactory({
        data: { object: updatedScheduleData },
      });
      const response = await sendStripeWebhookRequest({ event, request });

      expect(response.status()).toEqual(200);
      expect(await getJson(response)).toEqual({ message: 'OK' });

      // Verify the schedule was updated
      const updatedSchedule =
        await retrieveStripeSubscriptionScheduleWithPhasesFromDatabaseById(
          initialSchedule.stripeId,
        );
      expect(updatedSchedule).not.toBeNull();
      expect(updatedSchedule!.stripeId).toEqual(initialSchedule.stripeId);
      expect(updatedSchedule!.subscriptionId).toEqual(subscription.stripeId);
      expect(updatedSchedule!.currentPhaseStart!.getTime()).toEqual(
        updatedStartDate * 1000,
      );
      expect(updatedSchedule!.currentPhaseEnd!.getTime()).toEqual(
        updatedEndDate * 1000,
      );
      expect(updatedSchedule!.phases.length).toEqual(1);
      expect(updatedSchedule!.phases[0].priceId).toEqual(price.stripeId);
      expect(updatedSchedule!.phases[0].quantity).toEqual(2);

      // Cleanup
      await deleteOrganizationFromDatabaseById(organization.id);
      await deleteUserAccountFromDatabaseById(user.id);
    });
  });
});
