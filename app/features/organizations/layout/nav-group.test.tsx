import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';
import { HomeIcon, SettingsIcon } from 'lucide-react';
import { createRoutesStub } from 'react-router';
import { describe, expect, test } from 'vitest';

import { SidebarProvider } from '~/components/ui/sidebar';
import { render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { NavGroupItemWithoutChildren, NavGroupProps } from './nav-group';
import { NavGroup } from './nav-group';

const createNavGroupItemWithoutChildren: Factory<
  NavGroupItemWithoutChildren
> = ({
  title = faker.lorem.words(2),
  icon = faker.helpers.arrayElement([HomeIcon, SettingsIcon]),
  url = faker.helpers.arrayElement([
    '/account',
    '/dashboard',
    '/home',
    '/profile',
    '/settings',
  ]),
} = {}) => ({ title, icon, url });

const createItemsWithoutChildren = (
  length: number,
): NavGroupItemWithoutChildren[] =>
  faker.helpers
    .uniqueArray(() => createNavGroupItemWithoutChildren().url, length)
    .map(url => createNavGroupItemWithoutChildren({ url }));

const createProps: Factory<NavGroupProps> = ({
  items = createItemsWithoutChildren(2),
  size = 'default',
  title,
  className = faker.lorem.word(),
} = {}) => ({ items, size, title, className });

describe('NavGroup Component', () => {
  test('given: items with icons, should: render navigation group with title and items', () => {
    const title = faker.lorem.words(3);
    const props = createProps({ title });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavGroup {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify title is rendered.
    expect(screen.getByText(title)).toBeInTheDocument();

    // Verify all items are rendered.
    for (const item of props.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      if ('url' in item) {
        const link = screen.getByRole('link', { name: item.title });
        expect(link).toHaveAttribute('href', item.url);
      }
    }
  });

  test('given: collapsible items, should: render collapsible navigation group and expand on click', async () => {
    const user = userEvent.setup();
    const props = createProps({
      items: [
        {
          title: 'Settings',
          icon: SettingsIcon,
          items: [
            { title: 'Profile', url: '/settings/profile' },
            { title: 'Security', url: '/settings/security' },
          ],
        },
      ],
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavGroup {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify parent item is rendered
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();

    // Verify child items are initially hidden
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Security')).not.toBeInTheDocument();

    // Click the settings button to expand
    await user.click(settingsButton);

    // Verify child items are now visible
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  test('given: an active route, should: highlight the active navigation item', () => {
    const items = createItemsWithoutChildren(2);
    const props = createProps({ items });
    const path = items[0].url;
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavGroup {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    const homeLink = screen.getByRole('link', { name: items[0].title });
    expect(homeLink).toHaveAttribute('aria-current', 'page');

    const settingsLink = screen.getByRole('link', { name: items[1].title });
    expect(settingsLink).not.toHaveAttribute('aria-current');
  });

  test('given: no title, should: render navigation group without title', () => {
    const props = createProps();
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavGroup {...props} /> },
    ]);

    // This is a workaround and an absolute exception to check if the title
    // is NOT rendered.
    const { container } = render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify title is NOT rendered.
    expect(
      container.querySelector('[data-slot="sidebar-group-label"]'),
    ).not.toBeInTheDocument();
  });

  test('given: custom className, should: apply the className to the navigation group', () => {
    const props = createProps();
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <NavGroup {...props} /> },
    ]);

    const { container } = render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    expect(container.firstChild?.firstChild).toHaveClass(props.className!);
  });
});
