import { href } from 'react-router';
import { describe, expect, test, vi } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { CancelOrModifySubscriptionModalContentProps } from './cancel-or-modify-subscription-modal-content';
import { CancelOrModifySubscriptionModalContent } from './cancel-or-modify-subscription-modal-content';

const createProps: Factory<CancelOrModifySubscriptionModalContentProps> = ({
  canCancelSubscription = false,
  currentTier = 'low',
  currentTierInterval = 'annual' as const,
  isSwitchingToHigh = false,
  isSwitchingToLow = false,
  isSwitchingToMid = false,
  onCancelSubscriptionClick = vi.fn(),
} = {}) => ({
  canCancelSubscription,
  currentTier,
  currentTierInterval,
  isSwitchingToHigh,
  isSwitchingToLow,
  isSwitchingToMid,
  onCancelSubscriptionClick,
});

describe('CancelOrModifySubscriptionModalContent component', () => {
  test('given: any props, should: render tab buttons to switch between monthly and annual', async () => {
    const user = userEvent.setup();
    const props = createProps();
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Check initial state (annual by default)
    expect(screen.getByRole('tab', { name: /annual/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Switch to monthly
    await user.click(screen.getByRole('tab', { name: /monthly/i }));
    expect(screen.getByRole('tab', { name: /monthly/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Verify save monthly message appears only on annual tab
    const saveMonthlyText = screen.getByText(
      /save up to 20% on the annual plan/i,
    );
    expect(saveMonthlyText).toBeInTheDocument();

    // Switch back to annual and verify message appears
    await user.click(screen.getByRole('tab', { name: /annual/i }));
    expect(
      screen.queryByText(/save 20% on the annual plan/i),
    ).not.toBeInTheDocument();
  });

  test('given: user is on low tier, should: show current plan and upgrade buttons', () => {
    const props = createProps({ currentTier: 'low' });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Current plan should be marked
    expect(
      screen.getByRole('button', { name: /current plan/i }),
    ).toBeDisabled();

    // Should show upgrade buttons for mid and high tiers
    expect(screen.getAllByRole('button', { name: /upgrade/i })).toHaveLength(2);

    // Enterprise should be a link
    expect(
      screen.getByRole('link', { name: /contact sales/i }),
    ).toHaveAttribute('href', href('/contact-sales'));
  });

  test('given: user is on mid tier, should: show current plan, upgrade and downgrade buttons', () => {
    const props = createProps({ currentTier: 'mid' });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Current plan should be marked
    expect(
      screen.getByRole('button', { name: /current plan/i }),
    ).toBeDisabled();

    // Should show downgrade button for low tier
    expect(
      screen.getByRole('button', { name: /downgrade/i }),
    ).toBeInTheDocument();

    // Should show upgrade button for high tier
    expect(
      screen.getByRole('button', { name: /upgrade/i }),
    ).toBeInTheDocument();

    // Enterprise should be a link
    expect(
      screen.getByRole('link', { name: /contact sales/i }),
    ).toHaveAttribute('href', href('/contact-sales'));
  });

  test('given: user is on high tier, should: show current plan and downgrade buttons', () => {
    const props = createProps({ currentTier: 'high' });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Current plan should be marked
    expect(
      screen.getByRole('button', { name: /current plan/i }),
    ).toBeDisabled();

    // Should show downgrade buttons for low and mid tiers
    expect(screen.getAllByRole('button', { name: /downgrade/i })).toHaveLength(
      2,
    );

    // Enterprise should be a link
    expect(
      screen.getByRole('link', { name: /contact sales/i }),
    ).toHaveAttribute('href', href('/contact-sales'));
  });

  test.each(['mid', 'high'] as const)(
    'given: user is switching to low tier, should: show downgrading status',
    currentTier => {
      const props = createProps({ currentTier, isSwitchingToLow: true });
      const RouterStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <CancelOrModifySubscriptionModalContent {...props} />
          ),
        },
      ]);

      render(<RouterStub initialEntries={['/']} />);

      expect(
        screen.getByRole('button', { name: /downgrading/i }),
      ).toBeDisabled();
    },
  );

  test('given: user is switching to mid tier from low tier, should: show upgrading status', () => {
    const props = createProps({ currentTier: 'low', isSwitchingToMid: true });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    expect(screen.getByRole('button', { name: /upgrading/i })).toBeDisabled();
  });

  test('given: user is switching to mid tier from high tier, should: show downgrading status', () => {
    const props = createProps({ currentTier: 'high', isSwitchingToMid: true });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const downgradingButton = screen.getByRole('button', {
      name: /downgrading/i,
    });
    expect(downgradingButton).toBeInTheDocument();
    expect(downgradingButton).toBeDisabled();
  });

  test.each(['low', 'mid'] as const)(
    'given: user is switching to high tier, should: show upgrading status',
    currentTier => {
      const props = createProps({ currentTier, isSwitchingToHigh: true });
      const RouterStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <CancelOrModifySubscriptionModalContent {...props} />
          ),
        },
      ]);

      render(<RouterStub initialEntries={['/']} />);

      expect(screen.getByRole('button', { name: /upgrading/i })).toBeDisabled();
    },
  );

  test('given: the user has a subscription they can cancel, should: show cancellation option', () => {
    const props = createProps({ canCancelSubscription: true });
    const RouterStub = createRoutesStub([
      {
        path: '/',
        Component: () => <CancelOrModifySubscriptionModalContent {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    expect(
      screen.getByRole('button', { name: /cancel subscription/i }),
    ).toBeInTheDocument();
  });

  test.each(['low', 'mid', 'high'] as const)(
    "given: the user is on the monthly plan, should: show 'switch to annual' button for their current tier",
    currentTier => {
      const props = createProps({
        currentTier,
        currentTierInterval: 'monthly',
      });
      const RouterStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <CancelOrModifySubscriptionModalContent {...props} />
          ),
        },
      ]);

      render(<RouterStub initialEntries={['/']} />);

      // Should show "Switch to annual and save 20%" button
      expect(
        screen.getByRole('button', { name: /switch to annual/i }),
      ).toBeInTheDocument();

      // Should NOT show the "current plan" button
      expect(
        screen.queryByRole('button', { name: /current plan/i }),
      ).not.toBeInTheDocument();
    },
  );

  test.each(['low', 'mid', 'high'] as const)(
    "given: the user is on the annual plan, should: show 'switch to monthly' button for their current tier",
    async currentTier => {
      const user = userEvent.setup();
      const props = createProps({
        currentTier,
        currentTierInterval: 'annual',
      });
      const RouterStub = createRoutesStub([
        {
          path: '/',
          Component: () => (
            <CancelOrModifySubscriptionModalContent {...props} />
          ),
        },
      ]);

      render(<RouterStub initialEntries={['/']} />);

      // Switch to the monthly plan
      await user.click(screen.getByRole('tab', { name: /monthly/i }));

      // Should show "Switch to monthly" button
      expect(
        screen.getByRole('button', { name: /switch to monthly/i }),
      ).toBeInTheDocument();

      // Should NOT show the "current plan" button
      expect(
        screen.queryByRole('button', { name: /current plan/i }),
      ).not.toBeInTheDocument();
    },
  );
});
