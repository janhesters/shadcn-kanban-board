import { faker } from '@faker-js/faker';
import { href } from 'react-router';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { getRandomTier } from './billing-factories.server';
import type { BillingPageProps } from './billing-page';
import { BillingPage } from './billing-page';

const path = '/organizations/:organizationSlug/settings/billing';

const createProps: Factory<BillingPageProps> = ({
  billingEmail = faker.internet.email(),
  cancelAtPeriodEnd = false,
  cancelOrModifySubscriptionModalProps = {
    canCancelSubscription: true,
    currentTier: 'high' as const,
    currentTierInterval: 'annual' as const,
  },
  createSubscriptionModalProps = {
    currentSeats: 1,
    planLimits: {
      low: 1,
      mid: 10,
      high: 25,
    },
  },
  currentInterval = 'monthly',
  currentMonthlyRatePerUser = faker.number.int({ min: 5, max: 50 }),
  currentPeriodEnd = faker.date.future(),
  currentSeats = faker.number.int({ min: 1, max: 50 }),
  currentTier = getRandomTier(),
  isCancellingSubscription = false,
  isEnterprisePlan = false,
  isKeepingCurrentSubscription = false,
  isOnFreeTrial = false,
  isResumingSubscription = false,
  isViewingInvoices = false,
  maxSeats = faker.number.int({ min: currentSeats, max: 200 }),
  organizationSlug = faker.string.uuid(),
  pendingChange,
  projectedTotal = currentMonthlyRatePerUser * maxSeats,
  subscriptionStatus = 'active',
} = {}) => ({
  billingEmail,
  cancelAtPeriodEnd,
  cancelOrModifySubscriptionModalProps,
  createSubscriptionModalProps,
  currentInterval,
  currentMonthlyRatePerUser,
  currentPeriodEnd,
  currentSeats,
  currentTier,
  isCancellingSubscription,
  isEnterprisePlan,
  isKeepingCurrentSubscription,
  isOnFreeTrial,
  isResumingSubscription,
  isViewingInvoices,
  maxSeats,
  organizationSlug,
  pendingChange,
  projectedTotal,
  subscriptionStatus,
});

describe('BillingPage component', () => {
  test('given: any props, should: render a heading and a description', () => {
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.getByRole('heading', { name: /billing/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manage your billing information/i),
    ).toBeInTheDocument();
  });

  test('given: the user is on a free trial plan, should: show an alert banner with the end date of the free trial and a button to enter their payment information', () => {
    const props = createProps({
      isOnFreeTrial: true,
      currentPeriodEnd: new Date('2025-02-12T00:00:00.000Z'),
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.getByText(/your organization is currently on a free trial./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your free trial will end on february 12, 2025/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add payment information/i }),
    ).toBeInTheDocument();
  });

  test('given: a current monthly rate per user, seats, tier name and projected total, should: show plan details, seats info, projected total, and management buttons', () => {
    const props = createProps({
      currentMonthlyRatePerUser: 10,
      currentSeats: 3,
      maxSeats: 5,
      currentTier: 'mid',
      projectedTotal: 10 * 5,
      currentPeriodEnd: new Date('2025-03-15T00:00:00.000Z'),
    });

    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);
    render(<RouterStub initialEntries={[path]} />);

    // "Plan" heading must be an <h3>
    expect(
      screen.getByRole('heading', { name: /your plan/i, level: 3 }),
    ).toBeInTheDocument();

    // Tier name and rate
    expect(screen.getByText(/current plan/i)).toBeInTheDocument();
    expect(screen.getByText(/^startup$/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10/i)).toBeInTheDocument();
    expect(screen.getByText(/per user billed monthly/i)).toBeInTheDocument();
    // One button for mobile and one for desktop. In a real browser, one of
    // the two button will be hidden using `display: none`.
    expect(
      screen.getAllByRole('button', { name: /manage plan/i }),
    ).toHaveLength(2);

    // Users row shows current/max
    expect(screen.getByText(/^users$/i)).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 5/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage users/i })).toHaveAttribute(
      'href',
      href('/organizations/:organizationSlug/settings/members', {
        organizationSlug: props.organizationSlug,
      }),
    );

    // Projected total
    expect(screen.getByText(/projected total/i)).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();

    // Next billing date
    expect(screen.getByText(/next billing date/i)).toBeInTheDocument();
    expect(screen.getByText(/march 15, 2025/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view invoices/i }),
    ).toBeInTheDocument();
  });

  test('given: the user has their subscription cancelled at the period end, should: show an alert banner with a button to resume their subscription', () => {
    const props = createProps({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date('2025-02-12T00:00:00.000Z'),
      isOnFreeTrial: faker.datatype.boolean(),
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // It shows the cancel at period end banner
    expect(
      screen.getByText(/your subscription is ending soon./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your subscription runs out on february 12, 2025/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resume subscription/i }),
    ).toBeInTheDocument();

    // It hides any free trial banner
    expect(
      screen.queryByText(/your organization is currently on a free trial./i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/your free trial will end on february 12, 2025/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add payment information/i }),
    ).not.toBeInTheDocument();
  });

  test("given: the user's subscription is inactive, should: show an alert banner with a button to reactivate their subscription", () => {
    const props = createProps({
      subscriptionStatus: 'inactive',
      cancelAtPeriodEnd: faker.datatype.boolean(),
      currentPeriodEnd: new Date('2025-02-12T00:00:00.000Z'),
      isOnFreeTrial: faker.datatype.boolean(),
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // It shows the subscription inactive banner
    expect(
      screen.getByText(/your subscription is inactive./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your subscription has been cancelled./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reactivate subscription/i }),
    ).toBeInTheDocument();

    // It hides any cancel at period end banner
    expect(
      screen.queryByText(/your subscription is ending soon./i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/your subscription runs out on february 12, 2025/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /resume subscription/i }),
    ).not.toBeInTheDocument();

    // It hides any free trial banner
    expect(
      screen.queryByText(/your organization is currently on a free trial./i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/your free trial will end on february 12, 2025/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add payment information/i }),
    ).not.toBeInTheDocument();
  });

  test.skip('given: the user is on trial & adding their payment information, should: disable all other buttons and render a loading state on the clicked button', () => {
    const props = createProps({
      // isAddingPaymentInformation: true,
      isOnFreeTrial: true,
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // It shows the loading state on the clicked button
    expect(
      screen.getByRole('button', { name: /opening customer portal/i }),
    ).toBeDisabled();

    // It disables all other buttons
    const managePlanButtons = screen.getAllByRole('button', {
      name: /manage plan/i,
    });
    expect(managePlanButtons).toHaveLength(2);
    for (const button of managePlanButtons) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getByRole('button', { name: /view invoices/i }),
    ).toBeDisabled();
  });

  test("given: the user's subscription is set to be cancelled at the period end and the user is resuming their subscription, should: disable all other buttons and render a loading state on the clicked button", () => {
    const props = createProps({
      cancelAtPeriodEnd: true,
      isOnFreeTrial: faker.datatype.boolean(),
      isResumingSubscription: true,
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // It shows the loading state on the clicked button
    expect(
      screen.getByRole('button', { name: /resuming subscription/i }),
    ).toBeDisabled();

    // It disables all other buttons
    const managePlanButtons = screen.getAllByRole('button', {
      name: /manage plan/i,
    });
    expect(managePlanButtons).toHaveLength(2);
    for (const button of managePlanButtons) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getByRole('button', { name: /view invoices/i }),
    ).toBeDisabled();
  });

  test.skip("given: the user's subscription is inactive and the user is reactivating their subscription, should: disable all other buttons and render a loading state on the clicked button", () => {
    const props = createProps({
      subscriptionStatus: 'inactive',
      // isReactivatingSubscription: true,
      cancelAtPeriodEnd: faker.datatype.boolean(),
      isOnFreeTrial: faker.datatype.boolean(),
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // It shows the loading state on the clicked button
    expect(
      screen.getByRole('button', { name: /opening customer portal/i }),
    ).toBeDisabled();

    // It disables all other buttons
    const managePlanButtons = screen.getAllByRole('button', {
      name: /manage plan/i,
    });
    expect(managePlanButtons).toHaveLength(2);
    for (const button of managePlanButtons) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getByRole('button', { name: /view invoices/i }),
    ).toBeDisabled();
  });

  test('given: the user opens the cancel subscription modal, should: show a dialog with a title, description, a list of features, a button to cancel their subscription and a button to change their plan instead', async () => {
    const user = userEvent.setup();
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open the change plan modal
    const managePlanButton = screen.getAllByRole('button', {
      name: /manage plan/i,
    })[1];
    await user.click(managePlanButton);
    expect(
      screen.getByRole('heading', { name: /manage plan/i, level: 2 }),
    ).toBeInTheDocument();

    // Click the "Cancel subscription" button
    const cancelSubscriptionButton = screen.getByRole('button', {
      name: /cancel subscription/i,
    });
    await user.click(cancelSubscriptionButton);

    // It shows the dialog with the correct title, description, and features
    expect(
      screen.getByRole('heading', {
        name: /are you sure you want to cancel your subscription?/i,
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /canceling your subscription means you will lose access to your benefits at the end of your billing cycle./i,
      ),
    ).toBeInTheDocument();

    // It shows the list of features
    expect(screen.getByText(/sso/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited members/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited private projects/i)).toBeInTheDocument();
    expect(screen.getByText(/priority support/i)).toBeInTheDocument();

    // It shows the "Cancel subscription" button
    expect(
      screen.getByRole('button', { name: /cancel subscription/i }),
    ).toBeInTheDocument();

    // Clicking the "Select a different plan" button opens the change plan modal
    const changePlanButton = screen.getByRole('button', {
      name: /select a different plan/i,
    });
    await user.click(changePlanButton);
    expect(
      screen.getByRole('heading', { name: /manage plan/i, level: 2 }),
    ).toBeInTheDocument();
  });

  test('given: a billing email, should: show it in the billing email field', () => {
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.getByRole('heading', { name: /payment information/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/billing email/i)).toBeInTheDocument();
    expect(screen.getByText(props.billingEmail)).toBeInTheDocument();
  });

  test('given: no billing email, should: not show the billing email field', () => {
    const props = createProps({ billingEmail: '' });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(
      screen.queryByRole('heading', { name: /payment information/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/billing email/i)).not.toBeInTheDocument();
  });

  test('given: a pending change because a subscription is scheduled to downgrade, should: show a banner with the details of the pending change', () => {
    const props = createProps({
      pendingChange: {
        pendingTier: 'mid' as const,
        pendingInterval: 'monthly' as const,
        pendingChangeDate: new Date('2025-02-12T00:00:00.000Z'),
      },
      currentTier: 'high',
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/downgrade scheduled/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /your subscription will downgrade to the startup \(monthly\) plan on february 12, 2025/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /keep current subscription/i }),
    ).toBeInTheDocument();
  });

  test('given: a pending change because a subscription is scheduled to downgrade and the user is keeping their current subscription, should: show a banner with the details of the pending change', () => {
    const props = createProps({
      isKeepingCurrentSubscription: true,
      pendingChange: {
        pendingTier: 'high' as const,
        pendingInterval: 'monthly' as const,
        pendingChangeDate: new Date('2025-02-12T00:00:00.000Z'),
      },
      currentTier: 'high',
    });
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingPage {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/downgrade scheduled/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /your subscription will downgrade to the business \(monthly\) plan on february 12, 2025/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /updating subscription/i }),
    ).toBeDisabled();
  });

  test.todo(
    'given: the user is on an enterprise plan, should: show the available data',
  );
});
