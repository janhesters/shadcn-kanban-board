import { describe, expect, test } from 'vitest';

import { LINK_NOTIFICATION_TYPE } from './notification-constants';
import { createPopulatedNotificationQueryResult } from './notifications-factories.server';
import { mapInitialNotificationsDataToNotificationButtonProps } from './notifications-helpers.server';
import type { NotificationQueryResult } from './notifications-model.server';
import type { LinkNotificationData } from './notifications-schemas';

function sortByCreatedAt(
  notifications: NotificationQueryResult[],
): NotificationQueryResult[] {
  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

describe('mapInitialNotificationsDataToNotificationButtonProps()', () => {
  test('given: no notifications and no panel data, should: return empty notifications and no badge', () => {
    const initialData = {
      lastOpenedAt: null,
      allNotifications: [],
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [],
        showBadge: false,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: notifications exist and panel was opened after latest notification, should: return notifications with no badge', () => {
    // Fixed notification content for stable assertions
    const content1: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'First',
      href: '/first',
    };
    const content2: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Second',
      href: '/second',
    };

    // Two notifications, one newer than the other
    const n1 = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content: content1,
      createdAt: new Date('2025-04-20T10:00:00Z'),
      readAt: null,
    });
    const n2 = createPopulatedNotificationQueryResult({
      recipientId: 'r2',
      notificationId: 'n2',
      content: content2,
      createdAt: new Date('2025-04-19T10:00:00Z'),
      readAt: null,
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      lastOpenedAt: new Date('2025-04-21T00:00:00Z'), // after the latest notification
      allNotifications,
      unreadNotifications: allNotifications,
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { recipientId: 'r1', isRead: false, ...content1 },
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
        showBadge: false,
        unreadNotifications: [
          { recipientId: 'r1', isRead: false, ...content1 },
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: notifications exist and panel was opened before latest notification, should: return notifications with badge', () => {
    // Fixed notification content for stable assertions
    const content1: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'First',
      href: '/first',
    };
    const content2: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Second',
      href: '/second',
    };

    // Two notifications, one newer than the other
    const n1 = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content: content1,
      createdAt: new Date('2025-04-20T10:00:00Z'),
      readAt: null,
    });
    const n2 = createPopulatedNotificationQueryResult({
      recipientId: 'r2',
      notificationId: 'n2',
      content: content2,
      createdAt: new Date('2025-04-19T10:00:00Z'),
      readAt: null,
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      lastOpenedAt: new Date('2025-04-18T00:00:00Z'), // before the latest notification
      allNotifications,
      unreadNotifications: allNotifications,
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { recipientId: 'r1', isRead: false, ...content1 },
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
        showBadge: true,
        unreadNotifications: [
          { recipientId: 'r1', isRead: false, ...content1 },
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: notifications with one read and one unread, should: map isRead flags correctly', () => {
    const content1: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Read',
      href: '/read',
    };
    const content2: LinkNotificationData = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Unread',
      href: '/unread',
    };

    const n1 = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content: content1,
      createdAt: new Date('2025-04-20T10:00:00Z'),
      readAt: new Date('2025-04-20T12:00:00Z'),
    });
    const n2 = createPopulatedNotificationQueryResult({
      recipientId: 'r2',
      notificationId: 'n2',
      content: content2,
      createdAt: new Date('2025-04-19T10:00:00Z'),
      readAt: null,
    });
    const allNotifications = sortByCreatedAt([n1, n2]);

    const initialData = {
      lastOpenedAt: null,
      allNotifications,
      unreadNotifications: [n2],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);
    const expected = {
      notificationButtonProps: {
        allNotifications: [
          { recipientId: 'r1', isRead: true, ...content1 },
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
        showBadge: true,
        unreadNotifications: [
          { recipientId: 'r2', isRead: false, ...content2 },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: panel was opened at exactly the same time as latest notification, should: return notifications with no badge', () => {
    const content = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Exact',
      href: '/exact',
    };

    const createdAt = new Date('2025-04-20T10:00:00Z');

    const n = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content,
      createdAt,
      readAt: null,
    });

    const initialData = {
      lastOpenedAt: createdAt,
      allNotifications: [n],
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
        showBadge: false,
        unreadNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: no unread notifications but a newer notification exists, should: return notifications with badge', () => {
    const content = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Read but new',
      href: '/read',
    };

    const createdAt = new Date('2025-04-20T10:00:00Z');

    const n = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content,
      createdAt,
      readAt: new Date('2025-04-20T11:00:00Z'),
    });

    const initialData = {
      lastOpenedAt: new Date('2025-04-19T10:00:00Z'),
      allNotifications: [n],
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ recipientId: 'r1', isRead: true, ...content }],
        showBadge: true,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: future dated notification, should: return notifications with badge', () => {
    const content = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'Future',
      href: '/future',
    };

    const futureDate = new Date('3025-01-01T00:00:00Z');

    const n = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content,
      createdAt: futureDate,
      readAt: null,
    });

    const initialData = {
      lastOpenedAt: new Date('2025-04-27T00:00:00Z'),
      allNotifications: [n],
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
        showBadge: true,
        unreadNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: no notifications but lastOpenedAt exists, should: return empty notifications with no badge', () => {
    const initialData = {
      lastOpenedAt: new Date('2025-04-27T00:00:00Z'),
      allNotifications: [],
      unreadNotifications: [],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [],
        showBadge: false,
        unreadNotifications: [],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: lastOpenedAt is null and notifications exist, should: return notifications with badge', () => {
    const content = {
      type: LINK_NOTIFICATION_TYPE,
      text: 'New notification',
      href: '/new',
    };

    const createdAt = new Date('2025-04-20T10:00:00Z');

    const n = createPopulatedNotificationQueryResult({
      recipientId: 'r1',
      notificationId: 'n1',
      content,
      createdAt,
      readAt: null,
    });

    const initialData = {
      lastOpenedAt: null,
      allNotifications: [n],
      unreadNotifications: [n],
    };

    const actual =
      mapInitialNotificationsDataToNotificationButtonProps(initialData);

    const expected = {
      notificationButtonProps: {
        allNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
        showBadge: true,
        unreadNotifications: [{ recipientId: 'r1', isRead: false, ...content }],
      },
    };

    expect(actual).toEqual(expected);
  });
});
