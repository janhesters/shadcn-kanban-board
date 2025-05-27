import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { createRoutesStub } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { OnboardingOrganizationFormCardProps } from './onboarding-organization-form-card';
import { OnboardingOrganizationFormCard } from './onboarding-organization-form-card';
import type { OnboardingOrganizationErrors } from './onboarding-organization-schemas';

const createProps: Factory<OnboardingOrganizationFormCardProps> = ({
  errors,
  isCreatingOrganization = false,
} = {}) => ({ errors, isCreatingOrganization });

describe('OnboardingOrganizationFormCard Component', () => {
  test('given: component renders with default props, should: render a card with a name input, logo input, and submit button', () => {
    const path = '/onboarding';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingOrganizationFormCard /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description are displayed.
    expect(screen.getByText(/create your organization/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /you can invite other users to join your organization later through the organization settings/i,
      ),
    ).toBeInTheDocument();

    // Verify form elements are present.
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  test('given: isCreatingOrganization is true, should: disable form and show loading state', () => {
    const props = createProps({ isCreatingOrganization: true });
    const path = '/onboarding';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingOrganizationFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByLabelText(/organization name/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();

    // Verify loading indicator is shown
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  test('given: validation errors exist, should: display error messages', () => {
    const errorMessage = 'Name must be at least 3 characters';
    const errors: OnboardingOrganizationErrors = {
      name: { type: 'min', message: errorMessage },
    };

    const props = createProps({ errors });
    const path = '/onboarding';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OnboardingOrganizationFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
