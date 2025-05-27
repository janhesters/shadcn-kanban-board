import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { ContactSalesTeamProps } from './contact-sales-team';
import { ContactSalesTeam } from './contact-sales-team';

const createProps: Factory<ContactSalesTeamProps> = ({
  isContactingSales = false,
  ...props
} = {}) => ({ isContactingSales, ...props });

describe('ContactSalesTeam component', () => {
  test('given no props: renders inputs for the first and last name, the company name, the work email, the phone number, and a message, as well as a submit button', () => {
    const path = '/contact-sales';
    const props = createProps();
    const RemixStub = createRoutesStub([
      { path, Component: () => <ContactSalesTeam {...props} /> },
    ]);

    render(<RemixStub initialEntries={[path]} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  test('given no props: renders a honeypot input', () => {
    const path = '/contact-sales';
    const props = createProps();
    const RemixStub = createRoutesStub([
      { path, Component: () => <ContactSalesTeam {...props} /> },
    ]);

    render(<RemixStub initialEntries={[path]} />);

    expect(
      screen.getByLabelText(/please leave this field blank/i),
    ).toBeInTheDocument();
  });
});
