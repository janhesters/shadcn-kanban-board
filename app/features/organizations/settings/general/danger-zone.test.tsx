import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../../organizations-factories.server';
import type { DangerZoneProps } from './danger-zone';
import { DangerZone } from './danger-zone';

const createProps: Factory<DangerZoneProps> = ({
  isDeletingOrganization = false,
  isSubmitting = false,
  organizationName = createPopulatedOrganization().name,
} = {}) => ({ isDeletingOrganization, isSubmitting, organizationName });

describe('DangerZone Component', () => {
  test('given: component renders with default props, should: render danger zone section with delete button', () => {
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...createProps()} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify section title is present
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();

    // Verify delete button and description are present
    expect(
      screen.getByRole('button', { name: /delete organization/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/once deleted, it will be gone forever/i),
    ).toBeInTheDocument();
  });

  test('given: delete button is clicked, should: open confirmation dialog', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...createProps()} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Click delete button
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );

    // Verify dialog content is shown
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this organization/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete this organization$/i }),
    ).toBeInTheDocument();
  });

  test('given: isSubmitting is true, should: disable all buttons', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => (
          <DangerZone {...createProps({ isSubmitting: true })} />
        ),
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Click delete button to open dialog
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );

    // Verify buttons are disabled
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /delete this organization$/i }),
    ).toBeDisabled();
  });

  test('given: isDeletingOrganization is true, should: show loading state on delete button', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      {
        path,
        Component: () => (
          <DangerZone {...createProps({ isDeletingOrganization: true })} />
        ),
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Click delete button to open dialog
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );

    // Verify loading state
    const deleteConfirmButton = screen.getByRole('button', {
      name: /deleting organization/i,
    });
    expect(deleteConfirmButton).toBeInTheDocument();
  });

  test('given: dialog is open and cancel is clicked, should: close the dialog', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...createProps()} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open dialog
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );

    // Click cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify dialog is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('given: dialog is open, should: submit form with delete intent when confirm is clicked and the submit button should be disabled until the user types in the organization name', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open dialog
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );

    // Get the delete confirmation button and verify form attributes
    const deleteConfirmButton = screen.getByRole('button', {
      name: /delete this organization$/i,
    });
    expect(deleteConfirmButton).toHaveAttribute('name', 'intent');
    expect(deleteConfirmButton).toHaveAttribute('value', 'delete-organization');
    expect(deleteConfirmButton).toHaveAttribute('type', 'submit');
    expect(deleteConfirmButton).toBeDisabled();

    // Type in the organization name
    await user.type(
      screen.getByLabelText(
        new RegExp(
          `to confirm, type "${props.organizationName}" in the box below`,
          'i',
        ),
      ),
      props.organizationName,
    );

    // Verify the delete button is enabled
    expect(deleteConfirmButton).toBeEnabled();
  });

  test('given: dialog is opened, text entered, closed, and reopened, should: clear the confirmation input', async () => {
    const user = userEvent.setup();
    const path = '/organizations/test/settings/general';
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    const getDialogInput = () =>
      screen.getByRole('textbox', {
        name: new RegExp(
          `to confirm, type "${props.organizationName}" in the box below`,
          'i',
        ),
      });

    // --- First Open ---
    // Open dialog
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Type some text (not the full name)
    const inputText = 'some text';
    await user.type(getDialogInput(), inputText);

    // Verify input has text
    expect(getDialogInput()).toHaveValue(inputText);

    // --- Close Dialog ---
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // --- Second Open ---
    await user.click(
      screen.getByRole('button', { name: /delete organization/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify input is now empty
    expect(getDialogInput()).toHaveValue('');

    // Verify delete button is disabled again
    expect(
      screen.getByRole('button', { name: /delete this organization$/i }),
    ).toBeDisabled();
  });
});
