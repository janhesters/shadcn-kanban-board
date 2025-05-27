import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { act, createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { loginIntents } from '../user-authentication-constants';
import type { LoginVerificationAwaitingProps } from './login-verification-awaiting';
import { LoginVerificationAwaiting } from './login-verification-awaiting';

const createProps: Factory<LoginVerificationAwaitingProps> = ({
  email = faker.internet.email(),
  isResending = false,
  isSubmitting = false,
} = {}) => ({
  email,
  isResending,
  isSubmitting,
});

describe('LoginVerificationAwaiting Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('given: component renders with default props, should: display correct content, include email input, show resend button, disable fieldset when waiting and render an alert that the user should check their spam folder', () => {
    const email = faker.internet.email();
    const props = createProps({ email });
    const path = '/login';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => <LoginVerificationAwaiting {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify the card title and description are displayed
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(
      screen.getByText(/we've sent a secure login link to your email address/i),
    ).toBeInTheDocument();

    // Verify the countdown message is displayed (initial countdown is 60 seconds)
    expect(
      screen.getByText(/if you haven't received the email within 60 seconds/i),
    ).toBeInTheDocument();

    // Verify the hidden email input is present with the correct value
    const hiddenInput = screen.getByDisplayValue(email);
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute('type', 'hidden');
    expect(hiddenInput).toHaveAttribute('name', 'email');

    // Verify the resend button has the correct text and attributes
    const button = screen.getByRole('button', {
      name: /request new login link/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('name', 'intent');
    expect(button).toHaveAttribute('value', loginIntents.loginWithEmail);

    // Verify the alert is displayed
    expect(
      screen.getByText(/remember to check your spam folder/i),
    ).toBeInTheDocument();
  });

  test('given: countdown reaches zero after 60 seconds, should: enable the form', () => {
    const props = createProps();
    const path = '/login';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => <LoginVerificationAwaiting {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Initially, the fieldset should be disabled
    const submitButton = screen.getByRole('button', {
      name: /request new login link/i,
    });
    expect(submitButton).toBeDisabled();

    // Advance time to make the countdown reach zero
    act(() => {
      vi.advanceTimersByTime(60_000); // 60 seconds
    });

    // Now the fieldset should be enabled
    expect(submitButton).toBeEnabled();

    // The countdown message should now show the zero state
    expect(
      screen.getByText(
        /if you haven't received the email, you may request another login link now/i,
      ),
    ).toBeInTheDocument();
  });

  test('given: isResending is true, should: display loading state and disable the button', () => {
    const props = createProps({ isResending: true });
    const path = '/login';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => <LoginVerificationAwaiting {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Advance time to make the countdown reach zero.
    act(() => {
      vi.advanceTimersByTime(60_000); // 60 seconds
    });

    // Get the button with the loading text.
    const button = screen.getByRole('button', { name: /sending/i });
    expect(button).toBeDisabled();
  });

  test('given: isSubmitting is true, should: disable the form regardless of countdown', () => {
    const props = createProps({ isSubmitting: true });
    const path = '/login';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => <LoginVerificationAwaiting {...props} />,
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Advance time to make the countdown reach zero
    act(() => {
      vi.advanceTimersByTime(60_000); // 60 seconds
    });

    // The submit button should still be disabled due to isSubmitting, even
    // though countdown is at zero.
    const submitButton = screen.getByRole('button', {
      name: /request new login link/i,
    });
    expect(submitButton).toBeDisabled();
  });
});
