import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { LinkNotificationProps } from './notification-components';
import { LINK_NOTIFICATION_TYPE } from './notification-constants';
import type { NotificationsButtonProps } from './notifications-button';
import { NotificationsButton } from './notifications-button';

const createLinkNotification: Factory<LinkNotificationProps> = ({
  href = faker.internet.url(),
  isRead = false,
  recipientId = createId(),
  text = faker.lorem.sentence(),
} = {}) => ({
  href,
  isRead,
  recipientId,
  text,
  type: LINK_NOTIFICATION_TYPE,
});

const createProps: Factory<NotificationsButtonProps> = ({
  allNotifications = [],
  showBadge = false,
  unreadNotifications = [],
} = {}) => ({
  allNotifications,
  showBadge,
  unreadNotifications,
});

describe('NotificationsButton component', () => {
  test('given: no unread notifications, should: render button with default aria label', () => {
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', { name: /open notifications/i });
    expect(button).toBeInTheDocument();
  });

  test('given: should show badge (= unread notifications), should: render button with unread notifications aria label', () => {
    const props = createProps({ showBadge: true });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', {
      name: /open unread notifications/i,
    });
    expect(button).toBeInTheDocument();
  });

  test('given: button clicked, should: open notifications panel with unread tab selected by default', async () => {
    const user = userEvent.setup();
    const props = createProps({
      allNotifications: [createLinkNotification({ text: 'All notification' })],
      unreadNotifications: [
        createLinkNotification({ text: 'Unread notification' }),
      ],
    });
    const RouterStub = createRoutesStub([
      {
        action: () => ({}),
        Component: () => <NotificationsButton {...props} />,
        path: '/',
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', { name: /open notifications/i });
    await user.click(button);

    // Check that panel is open with tabs
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  test('given: notifications panel open, should: allow switching between tabs', async () => {
    const user = userEvent.setup();
    const allNotification = createLinkNotification({
      text: 'All notification',
    });
    const unreadNotification = createLinkNotification({
      text: 'Unread notification',
    });
    const props = createProps({
      allNotifications: [allNotification],
      unreadNotifications: [unreadNotification],
    });
    const RouterStub = createRoutesStub([
      {
        action: () => ({}),
        Component: () => <NotificationsButton {...props} />,
        path: '/',
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Open panel
    await user.click(
      screen.getByRole('button', { name: /open notifications/i }),
    );

    // Verify unread tab is selected by default and shows unread notification
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText(unreadNotification.text)).toBeInTheDocument();

    // Switch to all tab
    await user.click(screen.getByRole('tab', { name: /all/i }));
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText(allNotification.text)).toBeInTheDocument();
  });

  test('given: notifications panel open, should: show mark all as read button', async () => {
    const user = userEvent.setup();
    const props = createProps({
      allNotifications: [createLinkNotification({ text: 'All notification' })],
      unreadNotifications: [
        createLinkNotification({ text: 'Unread notification' }),
      ],
      showBadge: true,
    });
    const RouterStub = createRoutesStub([
      {
        action: () => ({}),
        Component: () => <NotificationsButton {...props} />,
        path: '/',
      },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Open panel
    await user.click(
      screen.getByRole('button', { name: /open unread notifications/i }),
    );

    // Check mark all as read button exists
    const markAllButton = screen.getByRole('button', {
      name: /mark all as read/i,
    });
    expect(markAllButton).toBeInTheDocument();
  });
});
