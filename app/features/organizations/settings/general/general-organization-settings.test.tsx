import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../../organizations-factories.server';
import type { GeneralOrganizationSettingsProps } from './general-organization-settings';
import { GeneralOrganizationSettings } from './general-organization-settings';

const createProps: Factory<GeneralOrganizationSettingsProps> = ({
  errors,
  isUpdatingOrganization = false,
  organization = {
    id: createPopulatedOrganization().id,
    name: createPopulatedOrganization().name,
    imageUrl: createPopulatedOrganization().imageUrl,
  },
} = {}) => ({ errors, isUpdatingOrganization, organization });

describe('GeneralOrganizationSettings Component', () => {
  test('given: component renders with default props, should: render organization settings form with name and logo fields', () => {
    const props = createProps();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <GeneralOrganizationSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are present
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization logo/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();

    // Verify initial values
    expect(screen.getByLabelText(/organization name/i)).toHaveValue(
      props.organization.name,
    );
  });

  test('given: isUpdatingOrganization is true, should: disable form and show loading state', () => {
    const props = createProps({ isUpdatingOrganization: true });
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <GeneralOrganizationSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByLabelText(/organization name/i)).toBeDisabled();
    expect(screen.getByLabelText(/organization logo/i)).toBeDisabled();

    // Verify loading state
    const saveButton = screen.getByRole('button', { name: /saving changes/i });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent(/saving changes/i);
  });

  test('given: form has errors, should: display error messages', () => {
    const errors = {
      name: {
        type: 'validation',
        message: 'organizations:settings.general.form.name-min-length',
      },
      logo: {
        type: 'validation',
        message: 'organizations:settings.general.form.logo-must-be-url',
      },
    };
    const props = createProps({ errors });
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <GeneralOrganizationSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify error messages are displayed
    expect(
      screen.getByText(
        /organization name must be at least 3 characters long./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/logo must be a valid url/i)).toBeInTheDocument();
  });
});
