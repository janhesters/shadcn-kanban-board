import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../../organizations-factories.server';
import type { OrganizationInfoProps } from './organization-info';
import { OrganizationInfo } from './organization-info';

const createProps: Factory<OrganizationInfoProps> = ({
  organizationName = createPopulatedOrganization().name,
  organizationLogoUrl = createPopulatedOrganization().imageUrl,
} = {}) => ({ organizationName, organizationLogoUrl });

describe('OrganizationInfo Component', () => {
  test('given: organization data, should: render organization name', () => {
    const props = createProps();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OrganizationInfo {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify organization name is displayed
    expect(screen.getByText(props.organizationName)).toBeInTheDocument();
  });

  test('given: organization without logo, should: render organization name and fallback avatar', () => {
    const organizationName = faker.company.name();
    const props = createProps({ organizationName, organizationLogoUrl: '' });
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OrganizationInfo {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify organization name is displayed
    expect(screen.getByText(organizationName)).toBeInTheDocument();

    // Verify fallback avatar is displayed with initials
    const fallback = screen.getByText(
      organizationName.slice(0, 2).toUpperCase(),
    );
    expect(fallback).toBeInTheDocument();
  });

  test('given: component renders, should: not have any interactive elements', () => {
    const props = createProps();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <OrganizationInfo {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify no buttons or inputs are present
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
