import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { createRoutesStub } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { OnboardingUserAccountFormCardProps } from './onboarding-user-account-form-card';
import { OnboardingUserAccountFormCard } from './onboarding-user-account-form-card';
import type { OnboardingUserAccountErrors } from './onboarding-user-account-schemas';

const createProps: Factory<OnboardingUserAccountFormCardProps> = ({
  errors,
  isCreatingUserAccount = false,
  userId = createPopulatedUserAccount().id,
} = {}) => ({ errors, isCreatingUserAccount, userId });

describe('OnboardingUserAccountFormCard Component', () => {
  test('given: component renders with default props, should: render a card with a name input, avatar input, and submit button', () => {
    const path = '/onboarding';
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingUserAccountFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description are displayed.
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /welcome to the react router saas template! please create your user account to get started./i,
      ),
    ).toBeInTheDocument();

    // Verify form elements are present.
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  test('given: isCreatingUserAccount is true, should: disable form and show loading state', () => {
    const props = createProps({ isCreatingUserAccount: true });
    const path = '/onboarding';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingUserAccountFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/avatar/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();

    // Verify loading indicator is shown
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  test('given: validation errors exist, should: display error messages', () => {
    const errorMessage = 'Name must be at least 2 characters';
    const errors: OnboardingUserAccountErrors = {
      name: { type: 'min', message: errorMessage },
    };

    const props = createProps({ errors });
    const path = '/onboarding';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingUserAccountFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
