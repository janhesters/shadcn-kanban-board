import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { LinkNotificationProps } from './notification-components';
import { LINK_NOTIFICATION_TYPE } from './notification-constants';
import type { NotificationsPanelContentProps } from './notifications-panel-content';
import { NotificationsPanelContent } from './notifications-panel-content';

const createLinkNotificationProps: Factory<LinkNotificationProps> = ({
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

const createPanelProps: Factory<NotificationsPanelContentProps> = ({
  notifications = [createLinkNotificationProps()],
} = {}) => ({ notifications });

describe('NotificationsPanelContent', () => {
  test('given: no notifications, should: show empty state', () => {
    const props = createPanelProps({ notifications: [] });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsPanelContent {...props} /> },
    ]);

    render(<RouterStub />);

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  test('given: a link notification, should: render it correctly', () => {
    const notification = createLinkNotificationProps();
    const props = createPanelProps({ notifications: [notification] });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsPanelContent {...props} /> },
    ]);

    render(<RouterStub />);

    expect(screen.getByText(notification.text)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', notification.href);
  });

  test('given: multiple notifications, should: render all of them', () => {
    const notifications = [
      createLinkNotificationProps(),
      createLinkNotificationProps(),
      createLinkNotificationProps(),
    ];
    const props = createPanelProps({ notifications });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsPanelContent {...props} /> },
    ]);

    render(<RouterStub />);

    for (const notification of notifications) {
      expect(screen.getByText(notification.text)).toBeInTheDocument();
    }
  });
});
