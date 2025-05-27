import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { describe, expect, test } from 'vitest';

import { SidebarProvider } from '~/components/ui/sidebar';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { NavUserProps } from './nav-user';
import { NavUser } from './nav-user';

const createUser: Factory<NavUserProps['user']> = ({
  name = createPopulatedUserAccount().name,
  email = createPopulatedUserAccount().email,
  avatar = createPopulatedUserAccount().imageUrl,
} = {}) => ({ name, email, avatar });

const createProps: Factory<NavUserProps> = ({ user = createUser() } = {}) => ({
  user,
});

describe('NavUser Component', () => {
  test('given: user data, should: render user information and handle menu interactions', () => {
    const props = createProps();
    const { user } = props;
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavUser {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify user name and email are displayed
    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();

    // Verify dropdown menu is initially closed
    expect(
      screen.queryByRole('menuitem', { name: /account/i }),
    ).not.toBeInTheDocument();
  });

  test('given: user data, should: render avatar fallback with initials when avatar fails to load', () => {
    const props = createProps({
      user: createUser({ avatar: 'invalid-url' }),
    });
    const { user } = props;
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavUser {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify avatar fallback is rendered with initials
    const avatarFallback = screen.getByText(
      user.name.slice(0, 2).toUpperCase(),
    );
    expect(avatarFallback).toBeInTheDocument();
  });

  test('given: user menu interactions, should: handle opening, closing, and navigation correctly', async () => {
    const user = userEvent.setup();
    const props = createProps();
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavUser {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify dropdown menu is initially closed
    expect(
      screen.queryByRole('menuitem', { name: /account/i }),
    ).not.toBeInTheDocument();

    // Click the user button to open the menu
    const userButton = screen.getByRole('button', {
      name: /open user menu/i,
    });
    await user.click(userButton);

    // Verify dropdown menu items are now visible
    expect(
      screen.getByRole('menuitem', { name: /account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /log out/i }),
    ).toBeInTheDocument();

    // Verify account link
    const accountLink = screen.getByRole('link', { name: /account/i });
    expect(accountLink).toHaveAttribute('href', '/settings/account');

    // Verify logout button
    const logoutButton = screen.getByRole('button', { name: /log out/i });
    expect(logoutButton).toHaveAttribute('name', 'intent');
    expect(logoutButton).toHaveAttribute('value', 'logout');
    expect(logoutButton).toHaveAttribute('type', 'submit');

    // Press escape to close the dropdown
    await user.keyboard('{Escape}');

    // Verify menu is closed
    expect(
      screen.queryByRole('menuitem', { name: /account/i }),
    ).not.toBeInTheDocument();
  });
});
