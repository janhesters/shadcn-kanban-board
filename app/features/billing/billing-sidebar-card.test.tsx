import { formatDate } from 'date-fns';
import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { BillingSidebarCardProps } from './billing-sidebar-card';
import { BillingSidebarCard } from './billing-sidebar-card';

const createProps: Factory<BillingSidebarCardProps> = ({
  createSubscriptionModalProps = {
    currentSeats: 1,
    planLimits: {
      low: 1,
      mid: 10,
      high: 25,
    },
  },
  state = 'trialing',
  showButton = true,
  trialEndDate = new Date('2024-12-31'),
} = {}) => ({ createSubscriptionModalProps, state, showButton, trialEndDate });

describe('BillingSidebarCard component', () => {
  test('given: free trial is active, should: show active trial message with end date and correct button text', () => {
    const props = createProps({
      state: 'trialing',
      trialEndDate: new Date('2024-12-31'),
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Title and date
    expect(screen.getByText(/business plan \(trial\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(formatDate(props.trialEndDate, 'MMMM dd, yyyy'), 'i'),
      ),
    ).toBeInTheDocument();

    // Button text for active trial
    const button = screen.getByRole('button', {
      name: /add payment information/i,
    });
    expect(button).toBeInTheDocument();
  });

  test('given: free trial has ended, should: show trial ended message with end date and correct button text', () => {
    const props = createProps({
      state: 'trialEnded',
      trialEndDate: new Date('2024-12-31'),
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Title and date
    expect(screen.getByText(/business plan \(trial\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(formatDate(props.trialEndDate, 'MMMM dd, yyyy'), 'i'),
      ),
    ).toBeInTheDocument();

    // Button text for ended trial
    const button = screen.getByRole('button', { name: /resume subscription/i });
    expect(button).toBeInTheDocument();
  });

  test('given: showButton is false, should: not show manage subscription button', () => {
    const props = createProps({ showButton: false });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('given: state is cancelled, should: show cancelled message', () => {
    const props = createProps({ state: 'cancelled' });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Cancelled message
    expect(screen.getByText(/subscription inactive/i)).toBeInTheDocument();
    expect(
      screen.getByText(/renew to keep using the app/i),
    ).toBeInTheDocument();

    // Button text for ended trial
    const button = screen.getByRole('button', { name: /choose plan/i });
    expect(button).toBeInTheDocument();
  });
});
