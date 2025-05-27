import { http, HttpResponse } from 'msw';
import type Stripe from 'stripe';

import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripeCustomerPortalSessionFactory,
  createStripePriceFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionItemFactory,
  createStripeSubscriptionScheduleFactory,
} from '~/features/billing/stripe-factories.server';

const cancelSubscriptionMock = http.post(
  'https://api.stripe.com/v1/subscriptions/:subscriptionId/cancel',
  ({ params }) => {
    const subscriptionId = params.subscriptionId as string;
    // simulate an immediate cancellation
    const cancelled = createStripeSubscriptionFactory({
      id: subscriptionId,
      status: 'canceled',
      canceled_at: Math.floor(Date.now() / 1000),
      cancel_at_period_end: false,
    });
    return HttpResponse.json(cancelled);
  },
);

const createBillingPortalSessionMock = http.post(
  'https://api.stripe.com/v1/billing_portal/sessions',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const customer = params.get('customer')!;
    const return_url = params.get('return_url')!;

    const session = createStripeCustomerPortalSessionFactory({
      customer,
      return_url,
    });

    return HttpResponse.json(session);
  },
);

const createCheckoutSessionMock = http.post(
  'https://api.stripe.com/v1/checkout/sessions',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    // Top-level params
    const customer = params.get('customer') ?? undefined;
    const mode =
      (params.get('mode') as Stripe.Checkout.Session.Mode) ?? undefined;
    const success_url = params.get('success_url') ?? undefined;
    const cancel_url = params.get('cancel_url') ?? undefined;

    // extract metadata[...] entries
    const metadata: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    // parse line_items[0][price] & line_items[0][quantity], etc.
    const itemsMap: Record<number, { price?: string; quantity?: number }> = {};
    for (const [key, value] of params.entries()) {
      const m = /^line_items\[(\d+)]\[(price|quantity)]$/.exec(key);
      if (m) {
        const index = Number(m[1]);
        itemsMap[index] = itemsMap[index] || {};
        if (m[2] === 'price') itemsMap[index].price = value;
        else itemsMap[index].quantity = Number(value);
      }
    }
    const line_items = Object.values(itemsMap).map(it => ({
      price: it.price!,
      quantity: it.quantity!,
    }));

    const session = createStripeCheckoutSessionFactory({
      customer,
      mode,
      success_url,
      cancel_url,
      metadata,
      // @ts-expect-error - TODO: fix this
      line_items,
      // if your tests inspect the items list, you can override:
      // line_items: { object: 'list', data: line_items, has_more: false, url: '/v1/checkout/sessions/…' }
    });

    return HttpResponse.json(session);
  },
);

const createCustomerMock = http.post(
  'https://api.stripe.com/v1/customers',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const email = params.get('email')!;
    const name = params.get('name')!;

    // extract metadata[...] entries
    const metadata: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    const customer = createStripeCustomerFactory({
      email,
      name,
      metadata,
    });

    return HttpResponse.json(customer);
  },
);

const createSubscriptionMock = http.post(
  'https://api.stripe.com/v1/subscriptions',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const customer = params.get('customer')!;

    // extract metadata[...] entries
    const metadata: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    // parse items[0][price] & items[0][quantity], etc.
    const itemsMap: Record<number, { price?: string; quantity?: number }> = {};
    for (const [key, value] of params.entries()) {
      const m = /^items\[(\d+)]\[(price|quantity)]$/.exec(key);
      if (m) {
        const index = Number(m[1]);
        itemsMap[index] = itemsMap[index] || {};
        if (m[2] === 'price') itemsMap[index].price = value;
        else itemsMap[index].quantity = Number(value);
      }
    }
    const itemParams = Object.values(itemsMap);

    // build SubscriptionItem list
    const subscriptionItems = itemParams.map(it =>
      createStripeSubscriptionItemFactory({
        price: createStripePriceFactory({ id: it.price! }),
        quantity: it.quantity!,
      }),
    );

    // now create a Subscription, overriding what we care about
    const subscription = createStripeSubscriptionFactory({
      customer,
      metadata,
      status: 'trialing',
      items: {
        object: 'list',
        data: subscriptionItems,
        has_more: false,
        url: `/v1/subscription_items?subscription=sub_xxx`, // tests typically don't hit this
      },
    });

    return HttpResponse.json(subscription);
  },
);

const deleteSubscriptionMock = http.delete(
  'https://api.stripe.com/v1/subscriptions/:subscriptionId',
  ({ params }) => {
    const subscriptionId = params.subscriptionId as string;
    // Stripe's delete endpoint returns { id, object: 'subscription', deleted: true }
    return HttpResponse.json({
      id: subscriptionId,
      object: 'subscription',
      deleted: true,
    });
  },
);

const listSubscriptionsMock = http.get(
  'https://api.stripe.com/v1/subscriptions',
  ({ request }) => {
    // parse query params out of the full URL
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customer')!;
    const status = url.searchParams.get('status')!; // should be 'active'

    // return a list with two sample subscriptions
    const sub1 = createStripeSubscriptionFactory({
      id: `sub_active_1`,
      customer: customerId,
    });
    const sub2 = createStripeSubscriptionFactory({
      id: `sub_active_2`,
      customer: customerId,
    });
    const list = {
      object: 'list',
      data: [sub1, sub2],
      has_more: false,
      url: `/v1/subscriptions?customer=${customerId}&status=${status}`,
    };
    return HttpResponse.json(list);
  },
);

const releaseScheduleMock = http.post(
  'https://api.stripe.com/v1/subscription_schedules/:scheduleId/release',
  ({ params }) => {
    const scheduleId = params.scheduleId as string;
    const released = createStripeSubscriptionScheduleFactory({
      id: scheduleId,
      status: 'released',
      released_at: Math.floor(Date.now() / 1000),
    });
    return HttpResponse.json(released);
  },
);

const retrieveScheduleMock = http.get(
  'https://api.stripe.com/v1/subscription_schedules/:scheduleId',
  ({ params }) => {
    const scheduleId = params.scheduleId as string;
    const schedule = createStripeSubscriptionScheduleFactory({
      id: scheduleId,
    });
    return HttpResponse.json(schedule);
  },
);

const retrieveSubscriptionMock = http.get(
  'https://api.stripe.com/v1/subscriptions/:subscriptionId',
  ({ params }) => {
    const subscriptionId = params.subscriptionId as string;
    // For tests, return a subscription that's scheduled to cancel
    const subscription = createStripeSubscriptionFactory({
      id: subscriptionId,
      cancel_at_period_end: true,
    });
    return HttpResponse.json(subscription);
  },
);

const updateCustomerMock = http.post(
  'https://api.stripe.com/v1/customers/:customerId',
  async ({ request, params }) => {
    const customerId = params.customerId as string;
    const body = await request.text();
    const paramsMap = new URLSearchParams(body);

    const email = paramsMap.get('email') ?? undefined;
    const name = paramsMap.get('name') ?? undefined;
    const metadata: Record<string, string> = {};
    for (const [key, value] of paramsMap.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    const customer = createStripeCustomerFactory({
      id: customerId,
      ...(email ? { email } : {}),
      ...(name ? { name } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });
    return HttpResponse.json(customer);
  },
);

const updateScheduleMock = http.post(
  'https://api.stripe.com/v1/subscription_schedules/:scheduleId',
  ({ params }) => {
    const scheduleId = params.scheduleId as string;
    // We could parse phases[…] here, but for most tests returning
    // a factory-generated schedule is enough.
    const updated = createStripeSubscriptionScheduleFactory({ id: scheduleId });
    return HttpResponse.json(updated);
  },
);

const updateSubscriptionMock = http.post(
  'https://api.stripe.com/v1/subscriptions/:subscriptionId',
  async ({ request, params }) => {
    const subscriptionId = params.subscriptionId as string;
    const body = await request.text();
    const paramsMap = new URLSearchParams(body);

    // detect cancel_at_period_end toggle
    const cancelFlag = paramsMap.get('cancel_at_period_end');
    // detect first item quantity override
    const qty = paramsMap.get('items[0][quantity]');

    const overrides: Partial<Stripe.Subscription> = { id: subscriptionId };
    if (cancelFlag !== null) {
      overrides.cancel_at_period_end = cancelFlag === 'true';
    }
    if (qty !== null) {
      overrides.items = {
        object: 'list',
        data: [
          {
            // @ts-expect-error - TODO: fix this
            price: paramsMap.get('items[0][price]')!,
            quantity: Number(qty),
            subscription: subscriptionId,
            id: `si_${subscriptionId}`,
            // minimal required fields…
          },
        ],
        has_more: false,
        url: `/v1/subscription_items?subscription=${subscriptionId}`,
      };
    }

    const updated = createStripeSubscriptionFactory(overrides);
    return HttpResponse.json(updated);
  },
);

export const stripeHandlers = [
  cancelSubscriptionMock,
  createBillingPortalSessionMock,
  createCheckoutSessionMock,
  createCustomerMock,
  createSubscriptionMock,
  deleteSubscriptionMock,
  listSubscriptionsMock,
  releaseScheduleMock,
  retrieveScheduleMock,
  retrieveSubscriptionMock,
  updateCustomerMock,
  updateScheduleMock,
  updateSubscriptionMock,
];
