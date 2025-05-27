import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { describe, expect, test } from 'vitest';

import { SidebarProvider } from '~/components/ui/sidebar';
import { getRandomTier } from '~/features/billing/billing-factories.server';
import { render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../organizations-factories.server';
import type { OrganizationSwitcherProps } from './organization-switcher';
import { OrganizationSwitcher } from './organization-switcher';

const createOrganization: Factory<
  OrganizationSwitcherProps['organizations'][0]
> = ({
  id = createPopulatedOrganization().id,
  slug = createPopulatedOrganization().slug,
  name = createPopulatedOrganization().name,
  logo = createPopulatedOrganization().imageUrl,
  tier = getRandomTier(),
} = {}) => ({ id, slug, name, logo, tier });

const createProps: Factory<OrganizationSwitcherProps> = ({
  organizations = [
    createOrganization({ name: 'Home Org' }),
    createOrganization({ name: 'Work Org' }),
  ],
  currentOrganization = createOrganization({ name: 'Work Org' }),
} = {}) => ({ organizations, currentOrganization });

describe('OrganizationSwitcher Component', () => {
  test('given: organizations data, should: render current organization in the button', () => {
    const currentOrganization = createOrganization({ tier: 'low' });
    const props = createProps({ currentOrganization });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OrganizationSwitcher {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify current organization is displayed.
    expect(screen.getByText(currentOrganization.name)).toBeInTheDocument();
    expect(screen.getByText(/hobby/i)).toBeInTheDocument();
  });

  test('given: organizations data, should: handle dropdown menu interactions', async () => {
    const user = userEvent.setup();
    const props = createProps();
    const { organizations } = props;
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OrganizationSwitcher {...props} /> },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify dropdown menu is initially closed.
    expect(screen.queryByText(organizations[0].name)).not.toBeInTheDocument();

    // Click the organization button to open the menu.
    const orgButton = screen.getByRole('button');
    await user.click(orgButton);

    // Verify all organizations are now visible.
    for (const org of organizations) {
      expect(
        screen.getByRole('menuitem', { name: new RegExp(org.name, 'i') }),
      ).toBeInTheDocument();
    }

    // Verify new organization button is displayed.
    expect(
      screen.getByRole('link', { name: /new organization/i }),
    ).toHaveAttribute('href', '/organizations/new');

    // Press escape to close the dropdown.
    await user.keyboard('{Escape}');

    // Verify menu is closed.
    expect(screen.queryByText(organizations[0].name)).not.toBeInTheDocument();
  });
});
