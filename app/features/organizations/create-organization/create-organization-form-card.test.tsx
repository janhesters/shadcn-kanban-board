import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { createRoutesStub } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type {
  CreateOrganizationFormCardProps,
  CreateOrganizationFormErrors,
} from './create-organization-form-card';
import { CreateOrganizationFormCard } from './create-organization-form-card';

const createProps: Factory<CreateOrganizationFormCardProps> = ({
  errors,
  isCreatingOrganization = false,
} = {}) => ({ errors, isCreatingOrganization });

describe('CreateOrganizationFormCard Component', () => {
  test('given: component renders with default props, should: render a card with name input, logo upload, and submit button', () => {
    const path = '/organizations/new';
    const RouterStub = createRoutesStub([
      { path, Component: () => <CreateOrganizationFormCard /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description are displayed
    expect(screen.getByText(/create a new organization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tell us about your organization/i),
    ).toBeInTheDocument();

    // Verify form elements are present
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logo/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create organization/i }),
    ).toHaveAttribute('type', 'submit');
  });

  test('given: isCreatingOrganization is true, should: disable form and show loading state', () => {
    const props = createProps({ isCreatingOrganization: true });
    const path = '/organizations/new';
    const RouterStub = createRoutesStub([
      { path, Component: () => <CreateOrganizationFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByLabelText(/organization name/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();

    // Verify loading indicator is shown
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  test('given: validation errors exist, should: display error messages', () => {
    const errors: CreateOrganizationFormErrors = {
      name: { type: 'min', message: 'Name is required' },
      logo: {
        type: 'manual',
        message: 'Please upload a logo for your organization',
      },
    };

    const props = createProps({ errors });
    const path = '/organizations/new';
    const RouterStub = createRoutesStub([
      { path, Component: () => <CreateOrganizationFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify error messages are displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(
      screen.getByText('Please upload a logo for your organization'),
    ).toBeInTheDocument();
  });

  test('given: component renders, should: display terms and privacy links', () => {
    const path = '/organizations/new';
    const RouterStub = createRoutesStub([
      { path, Component: () => <CreateOrganizationFormCard /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify terms and privacy links are present
    expect(
      screen.getByRole('link', { name: /terms of service/i }),
    ).toHaveAttribute('href', '/terms-of-service');
    expect(
      screen.getByRole('link', { name: /privacy policy/i }),
    ).toHaveAttribute('href', '/privacy-policy');
  });
});
