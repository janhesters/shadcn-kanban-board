import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { DangerZoneProps } from './danger-zone';
import { DangerZone, DELETE_USER_ACCOUNT_INTENT } from './danger-zone';

const createOrganizationNames = (count: number) =>
  faker.helpers.uniqueArray(() => faker.company.name(), count);

const createProps: Factory<DangerZoneProps> = ({
  imlicitlyDeletedOrganizations = [],
  isDeletingAccount = false,
  organizationsBlockingAccountDeletion = [],
} = {}) => ({
  imlicitlyDeletedOrganizations,
  isDeletingAccount,
  organizationsBlockingAccountDeletion,
});

describe('DangerZone component', () => {
  test('given: no implicitly deleted organizations and no organizations blocking account deletion, should: render danger zone with an enabled button and clicking it opens a menu that asks to confirm the deletion', async () => {
    const user = userEvent.setup();
    const path = '/settings/account';
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify heading and descriptions
    expect(
      screen.getByRole('heading', { name: /danger zone/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /once you delete your account, there is no going back. please be certain/i,
      ),
    ).toBeInTheDocument();

    // Click button to open the dialog
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    // Verify dialog content
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /delete account/i, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete your account/i),
    ).toBeInTheDocument();

    // Verify form submission
    const deleteButton = screen.getByRole('button', {
      name: /delete this account/i,
    });
    expect(deleteButton).toHaveAttribute('name', 'intent');
    expect(deleteButton).toHaveAttribute('value', DELETE_USER_ACCOUNT_INTENT);
    expect(deleteButton).toHaveAttribute('type', 'submit');
  });

  test('given: organizations blocking account deletion, should: show warning and disable delete button', () => {
    const blockingOrgs = createOrganizationNames(2);
    const props = createProps({
      organizationsBlockingAccountDeletion: blockingOrgs,
    });
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify warning message
    expect(
      screen.getByText(
        /your account is currently an owner in these organizations:/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(blockingOrgs.join(', '))).toBeInTheDocument();
    expect(
      screen.getByText(
        /you must remove yourself, transfer ownership, or delete this organization before you can delete your user/i,
      ),
    ).toBeInTheDocument();

    // Verify button is disabled
    expect(
      screen.getByRole('button', { name: /delete account/i }),
    ).toBeDisabled();
  });

  test('given: organizations that will be implicitly deleted, should: show warning in confirmation dialog', async () => {
    const user = userEvent.setup();
    const implicitlyDeletedOrgs = createOrganizationNames(2);
    const props = createProps({
      imlicitlyDeletedOrganizations: implicitlyDeletedOrgs,
    });
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open dialog
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    // Verify warning about implicit deletions
    expect(
      screen.getByText(/the following organizations will be deleted:/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(implicitlyDeletedOrgs.join(', ')),
    ).toBeInTheDocument();
  });

  test('given: dialog is open and cancel is clicked, should: close the dialog', async () => {
    const user = userEvent.setup();
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...createProps()} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open dialog
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close dialog
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('given: account is being deleted, should: show loading state and disable buttons', async () => {
    const user = userEvent.setup();
    const path = '/settings/account';
    const props = createProps({ isDeletingAccount: true });
    const RouterStub = createRoutesStub([
      { path, Component: () => <DangerZone {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open dialog
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    // Verify loading state
    expect(screen.getByText(/deleting account/i)).toBeInTheDocument();

    // Verify buttons are disabled
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /deleting account/i }),
    ).toBeDisabled();
  });
});
