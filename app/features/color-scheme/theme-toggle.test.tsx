import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { describe, expect, test } from 'vitest';

import { render, screen } from '~/test/react-test-utils';

import { ThemeToggle } from './theme-toggle';

function renderThemeToggle() {
  const path = '/test';
  const RouterStub = createRoutesStub([{ path, Component: ThemeToggle }]);

  return render(
    <RouterStub
      initialEntries={[path]}
      hydrationData={{ loaderData: { root: { colorScheme: 'light' } } }}
    />,
  );
}

describe('ThemeToggle Component', () => {
  test('given: default render, should: show a button with correct aria-label and dropdown closed', () => {
    renderThemeToggle();

    const button = screen.getByRole('button', {
      name: /open theme menu/i,
    });
    expect(button).toBeInTheDocument();

    // Verify dropdown is initially closed
    expect(screen.queryByText(/appearance/i)).not.toBeInTheDocument();
  });

  test('given: user interactions, should: handle dropdown menu accessibility and keyboard navigation', async () => {
    const user = userEvent.setup();
    renderThemeToggle();

    // Get the button and verify initial state
    const button = screen.getByRole('button', {
      name: /open theme menu/i,
    });

    // Click to open dropdown
    await user.click(button);

    // Verify dropdown is open and menu items are visible
    const menu = screen.getByText(/appearance/i);
    expect(menu).toBeInTheDocument();

    // Verify all theme options are present
    expect(
      screen.getByRole('menuitem', { name: /light/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /system/i }),
    ).toBeInTheDocument();

    // Test keyboard navigation - Escape to close
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/appearance/i)).not.toBeInTheDocument();

    // Test keyboard navigation - open with Enter
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText(/appearance/i)).toBeInTheDocument();
  });
});
