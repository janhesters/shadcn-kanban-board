import type { NotificationRecipient } from '@prisma/client';
import { useFetchers } from 'react-router';

import { MARK_ONE_NOTIFICATION_AS_READ_INTENT } from './notification-constants';

type PendingNotification = {
  intent: typeof MARK_ONE_NOTIFICATION_AS_READ_INTENT;
  recipientId: NotificationRecipient['id'];
};
type MarkOneAsReadFetcher = ReturnType<typeof useFetchers>[number] &
  PendingNotification;

export function usePendingNotifications(): PendingNotification[] {
  return useFetchers()
    .filter((fetcher): fetcher is MarkOneAsReadFetcher => {
      return (
        fetcher.formData?.get('intent') === MARK_ONE_NOTIFICATION_AS_READ_INTENT
      );
    })
    .map(fetcher => ({
      intent: fetcher.formData?.get(
        'intent',
      ) as typeof MARK_ONE_NOTIFICATION_AS_READ_INTENT,
      recipientId: fetcher.formData?.get(
        'recipientId',
      ) as NotificationRecipient['id'],
    }));
}
