import { faker } from '@faker-js/faker';
import { href } from 'react-router';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
  within,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { priceLookupKeysByTierAndInterval } from './billing-constants';
import type { CreateSubscriptionModalContentProps } from './create-subscription-modal-content';
import { CreateSubscriptionModalContent } from './create-subscription-modal-content';

const createProps: Factory<CreateSubscriptionModalContentProps> = ({
  currentSeats = faker.number.int({ min: 1, max: 5 }),
  planLimits = { low: 1, mid: 10, high: 25 },
} = {}) => ({
  currentSeats,
  planLimits,
});

describe('CreateSubscriptionModalContent component', () => {
  test('given: default state, should: render annual plans then switch to monthly correctly', async () => {
    const user = userEvent.setup();
    const props = createProps();
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CreateSubscriptionModalContent {...props} />,
      },
    ]);
    render(<RouterStub initialEntries={['/']} />);

    // should render the two billing period tabs
    const annualTab = screen.getByRole('tab', { name: 'Annual' });
    const monthlyTab = screen.getByRole('tab', { name: 'Monthly' });
    expect(annualTab).toHaveAttribute('aria-selected', 'true');
    expect(monthlyTab).toHaveAttribute('aria-selected', 'false');

    // should render three "Subscribe Now" buttons for annual plans
    const annualButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(annualButtons).toHaveLength(3);
    // and each should carry the correct priceId
    expect(annualButtons[0]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.low.annual,
    );
    expect(annualButtons[1]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.mid.annual,
    );
    expect(annualButtons[2]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.high.annual,
    );

    // should render the enterprise "Contact Sales" link
    expect(screen.getByRole('link', { name: 'Contact Sales' })).toHaveAttribute(
      'href',
      href('/contact-sales'),
    );

    // when switching to monthly
    await user.click(monthlyTab);

    // should update tab selection
    expect(monthlyTab).toHaveAttribute('aria-selected', 'true');
    expect(annualTab).toHaveAttribute('aria-selected', 'false');

    // should show the annual savings message
    expect(
      screen.getByText('Save up to 20% on the annual plan.'),
    ).toBeInTheDocument();

    // should render three "Subscribe Now" buttons for monthly plans
    const monthlyButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(monthlyButtons).toHaveLength(3);
    expect(monthlyButtons[0]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.low.monthly,
    );
    expect(monthlyButtons[1]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.mid.monthly,
    );
    expect(monthlyButtons[2]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.high.monthly,
    );
  });

  test('given: 2 seats in use (low limit = 1), should: disable Hobby and show warning', () => {
    const props = createProps({
      currentSeats: 2,
      planLimits: { low: 1, mid: 10, high: 25 },
    });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CreateSubscriptionModalContent {...props} />,
      },
    ]);
    render(<RouterStub initialEntries={['/']} />);

    // find the three "Subscribe Now" buttons in order: low, mid, high
    const subscribeButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(subscribeButtons).toHaveLength(3);

    // Hobby (low) button
    expect(subscribeButtons[0]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.low.annual,
    );
    expect(subscribeButtons[0]).toBeDisabled();

    // Startup (mid) button
    expect(subscribeButtons[1]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.mid.annual,
    );
    expect(subscribeButtons[1]).toBeEnabled();

    // Business (high) button
    expect(subscribeButtons[2]).toHaveAttribute(
      'value',
      priceLookupKeysByTierAndInterval.high.annual,
    );
    expect(subscribeButtons[2]).toBeEnabled();

    // warning alert appears
    const alert = screen.getByRole('alert');
    // title
    expect(
      within(alert).getByText(/why are some plans disabled\?/i),
    ).toBeVisible();
    // description
    expect(
      within(alert).getByText(
        /you currently have 2 users, and the hobby plan only supports 1 user\. please choose a plan that supports at least 2 seats\./i,
      ),
    ).toBeVisible();
  });

  test('given: 12 seats in use (low=1, mid=10), should: disable Hobby & Startup and show combined warning', () => {
    const props = createProps({
      currentSeats: 12,
      planLimits: { low: 1, mid: 10, high: 25 },
    });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CreateSubscriptionModalContent {...props} />,
      },
    ]);
    render(<RouterStub initialEntries={['/']} />);

    // find the three "Subscribe Now" buttons
    const subscribeButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(subscribeButtons).toHaveLength(3);

    // Hobby & Startup should be disabled
    expect(subscribeButtons[0]).toBeDisabled();
    expect(subscribeButtons[1]).toBeDisabled();
    // Business remains enabled
    expect(subscribeButtons[2]).toBeEnabled();

    // warning alert mentions both plans
    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByText(/why are some plans disabled\?/i),
    ).toBeVisible();
    expect(
      within(alert).getByText(
        /you currently have 12 users, and the hobby plan only supports 1 user while the startup plan only supports 10 users\. please choose a plan that supports at least 12 seats\./i,
      ),
    ).toBeVisible();
  });
});
