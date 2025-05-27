import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { EmailInviteCardProps } from './invite-by-email-card';
import { EmailInviteCard } from './invite-by-email-card';

const createProps: Factory<EmailInviteCardProps> = ({
  currentUserIsOwner = false,
  errors,
  isInvitingByEmail = false,
  organizationIsFull = false,
} = {}) => ({
  currentUserIsOwner,
  errors,
  isInvitingByEmail,
  organizationIsFull,
});

const originalHasPointerCapture = (pointerId: number) =>
  globalThis.HTMLElement.prototype.hasPointerCapture.call(
    globalThis.HTMLElement.prototype,
    pointerId,
  );

beforeAll(() => {
  globalThis.HTMLElement.prototype.hasPointerCapture = vi.fn();
});

afterAll(() => {
  globalThis.HTMLElement.prototype.hasPointerCapture =
    originalHasPointerCapture;
});

describe('EmailInviteCard Component', () => {
  test('given: component renders, should: display card with title, description, and form elements', () => {
    const props = createProps();
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description
    expect(screen.getByText(/invite by email/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /enter your colleagues' email addresses, and we'll send them a personalized invitation to join your organization. you can also choose the role they'll join with./i,
      ),
    ).toBeInTheDocument();

    // Verify form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send email invitation/i }),
    ).toBeInTheDocument();
  });

  test('given: isInvitingByEmail is true, should: disable form and show loading state', () => {
    const props = createProps({ isInvitingByEmail: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();

    // Verify loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });

  test('given: validation errors exist, should: display error messages', () => {
    const errors = {
      email: {
        type: 'min',
        message: 'Email is required',
      },
      role: {
        type: 'invalid_type',
        message: 'Role is required',
      },
    };
    const props = createProps({ errors });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify error messages
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Role is required')).toBeInTheDocument();
  });

  test('given: current user is NOT an owner, should: not show owner role option', () => {
    const props = createProps({ currentUserIsOwner: false });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Find the hidden select element
    const select = screen.getByRole('combobox', { name: /role/i });
    const hiddenSelect = select.nextElementSibling as HTMLSelectElement;

    // Verify owner role option is not present in the hidden select
    expect(
      hiddenSelect.querySelector('option[value="owner"]'),
    ).not.toBeInTheDocument();
  });

  test('given: current user is an owner, should: show owner role option', () => {
    const props = createProps({ currentUserIsOwner: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Find the hidden select element
    const select = screen.getByRole('combobox', { name: /role/i });
    const hiddenSelect = select.nextElementSibling as HTMLSelectElement;

    // Verify owner role option is present in the hidden select
    expect(
      hiddenSelect.querySelector('option[value="owner"]'),
    ).toBeInTheDocument();
  });

  test('given: organization is full, should: disable form', () => {
    const props = createProps({ organizationIsFull: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { path, Component: () => <EmailInviteCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
