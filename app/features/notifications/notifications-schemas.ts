import { z } from 'zod';

import {
  LINK_NOTIFICATION_TYPE,
  MARK_ALL_NOTIFICATIONS_AS_READ_INTENT,
  MARK_ONE_NOTIFICATION_AS_READ_INTENT,
  NOTIFICATION_PANEL_OPENED_INTENT,
} from './notification-constants';

/* Notification types */

export const linkNotificationDataSchema = z.object({
  type: z.literal(LINK_NOTIFICATION_TYPE),
  text: z.string(),
  href: z.string(),
});

export type LinkNotificationData = z.infer<typeof linkNotificationDataSchema>;

/* Notification request schemas */

export const markOneAsReadSchema = z.object({
  intent: z.literal(MARK_ONE_NOTIFICATION_AS_READ_INTENT),
  recipientId: z.string(),
});

export const markAllAsReadSchema = z.object({
  intent: z.literal(MARK_ALL_NOTIFICATIONS_AS_READ_INTENT),
});

export const notificationPanelOpenedSchema = z.object({
  intent: z.literal(NOTIFICATION_PANEL_OPENED_INTENT),
});
