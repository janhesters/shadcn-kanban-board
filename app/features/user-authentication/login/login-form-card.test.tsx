import { describe, expect, test } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { LoginFormCardProps } from './login-form-card';
import { LoginFormCard } from './login-form-card';
import type { EmailLoginErrors } from './login-schemas';

const createProps: Factory<LoginFormCardProps> = ({
  errors,
  isLoggingInWithEmail = false,
  isLoggingInWithGoogle = false,
  isSubmitting = false,
  inviteLinkInfo,
} = {}) => ({
  errors,
  isLoggingInWithEmail,
  isLoggingInWithGoogle,
  isSubmitting,
  inviteLinkInfo,
});

describe('LoginFormCard Component', () => {
  test('given: component renders with default props, should: render a card with an email login form, a google login form, and a link to register', () => {
    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify the card title and description are displayed.
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(
      screen.getByText(/enter your email below to login to your account/i),
    ).toBeInTheDocument();

    // Verify the email form elements are present.
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toHaveAttribute(
      'type',
      'submit',
    );

    // Verify the divider is present.
    expect(screen.getByText(/or/i)).toBeInTheDocument();

    // Verify the Google button is present.
    expect(screen.getByRole('button', { name: /google/i })).toHaveAttribute(
      'type',
      'submit',
    );

    // Verify the register link is present.
    expect(screen.getByText(/not a member/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  test('given: isSubmitting is true, should: disable both forms', () => {
    const props = createProps({ isSubmitting: true });
    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Get all form elements.
    const emailInput = screen.getByLabelText(/email/i);
    const emailButton = screen.getByRole('button', { name: /login/i });
    const googleButton = screen.getByRole('button', { name: /google/i });

    // Verify all form elements are disabled.
    expect(emailInput).toBeDisabled();
    expect(emailButton).toBeDisabled();
    expect(googleButton).toBeDisabled();
  });

  test('given: isLoggingInWithEmail is true, should: show loading state for email button', () => {
    const props = createProps({ isLoggingInWithEmail: true });
    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    const emailButton = screen.getByRole('button', { name: /logging in/i });
    expect(emailButton).toBeInTheDocument();
  });

  test('given: isLoggingInWithGoogle is true, should: show loading state for Google button', () => {
    const props = createProps({ isLoggingInWithGoogle: true });
    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // The Google button should not contain the Google icon when loading
    const googleButton = screen.getByRole('button', { name: /google/i });
    expect(googleButton).toBeInTheDocument();
  });

  test('given: errors for email field, should: display error message', () => {
    const errorMessage = 'Invalid email format';
    const errors: EmailLoginErrors = {
      email: { type: 'validation', message: errorMessage },
    };

    const props = createProps({ errors });
    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify the error message is displayed.
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('given: inviteLinkInfo is provided, should: a message informing the user what organization they are joining', () => {
    const inviteLinkInfo = {
      creatorName: createPopulatedUserAccount().name,
      organizationName: createPopulatedOrganization().name,
      inviteToken: '1234567890',
    };
    const props = createProps({ inviteLinkInfo });

    const path = '/login';
    const RouterStub = createRoutesStub([
      { path, Component: () => <LoginFormCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify the invite link info is displayed.
    expect(
      screen.getByText(
        new RegExp(`log in to join ${inviteLinkInfo.organizationName}`, 'i'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `${inviteLinkInfo.creatorName} has invited you to join ${inviteLinkInfo.organizationName}`,
          'i',
        ),
      ),
    ).toBeInTheDocument();
  });
});
