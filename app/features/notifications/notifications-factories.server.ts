/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type {
  Notification,
  NotificationPanel,
  NotificationRecipient,
  Prisma,
} from '@prisma/client';

import type { Factory } from '~/utils/types';

import { LINK_NOTIFICATION_TYPE } from './notification-constants';
import type { NotificationQueryResult } from './notifications-model.server';
import type { NotificationType } from './notifications-panel-content';
import type { LinkNotificationData } from './notifications-schemas';

/**
 * Creates link notification data with populated values.
 *
 * @param params - Parameters to create link notification data with.
 * @param params.text - The text content of the notification. Defaults to a random sentence.
 * @param params.href - The URL the notification links to. Defaults to a random URL.
 * @returns A populated link notification data object with given params.
 */
export const createPopulatedLinkNotificationData: Factory<
  LinkNotificationData
> = ({
  text = faker.lorem.sentences(2),
  href = faker.internet.url(),
} = {}) => ({
  text,
  href,
  type: LINK_NOTIFICATION_TYPE,
});

/**
 * Creates a notification type with populated values.
 *
 * @param params - Parameters to create notification type with.
 * @param params.id - The ID of the notification. Defaults to a random CUID.
 * @param params.isRead - Whether the notification has been read. Defaults to false.
 * @param params.type - The type of notification. Defaults to a random supported type.
 * @param params.rest - Additional parameters passed to the specific notification type creator.
 * @returns A populated notification type with given params.
 */
export const createPopulatedNotificationType: Factory<NotificationType> = ({
  recipientId = createId(),
  isRead = false,
  type = faker.helpers.arrayElement([LINK_NOTIFICATION_TYPE]),
  ...rest
} = {}) => {
  switch (type) {
    case LINK_NOTIFICATION_TYPE: {
      return {
        recipientId,
        isRead,
        ...createPopulatedLinkNotificationData(rest),
      };
    }
    default: {
      return faker.helpers.arrayElement([
        { recipientId, isRead, ...createPopulatedLinkNotificationData(rest) },
      ]);
    }
  }
};

/**
 * Creates a notification with populated values.
 *
 * @param notificationParams - Notification params to create notification with.
 * @returns A populated notification with given params.
 */
export const createPopulatedNotification: Factory<
  Omit<Notification, 'content'> & {
    content: Prisma.InputJsonValue;
  }
> = ({
  id = createId(),
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  organizationId = createId(),
  content = createPopulatedNotificationType(),
} = {}) => ({ id, createdAt, updatedAt, organizationId, content });

/**
 * Creates a notification recipient with populated values.
 *
 * @param recipientParams - NotificationRecipient params to create recipient with.
 * @returns A populated notification recipient with given params.
 */
export const createPopulatedNotificationRecipient: Factory<
  NotificationRecipient
> = ({
  id = createId(),
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  notificationId = createId(),
  userId = createId(),
  readAt = null,
} = {}) => ({ id, createdAt, updatedAt, notificationId, userId, readAt });

/**
 * Creates a notification panel with populated values.
 *
 * @param panelParams - NotificationPanel params to create panel with.
 * @returns A populated notification panel with given params.
 */
export const createPopulatedNotificationPanel: Factory<NotificationPanel> = ({
  id = createId(),
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  userId = createId(),
  organizationId = createId(),
  lastOpenedAt = faker.date.recent({ days: 1, refDate: updatedAt }),
} = {}) => ({ id, createdAt, updatedAt, userId, organizationId, lastOpenedAt });

/**
 * Creates a notification query result with populated values. This represents the flattened
 * structure returned by database queries joining notifications with their recipients.
 *
 * @param queryResultParams - NotificationQueryResult params to create the result with.
 * @returns A populated notification query result with given params.
 */
export const createPopulatedNotificationQueryResult: Factory<
  NotificationQueryResult
> = ({
  recipientId = createPopulatedNotificationRecipient().id,
  readAt = null,
  notificationId = createPopulatedNotification().id,
  content = createPopulatedNotification()
    .content as unknown as Notification['content'],
  createdAt = createPopulatedNotification().createdAt,
} = {}) => ({ recipientId, readAt, notificationId, content, createdAt });
