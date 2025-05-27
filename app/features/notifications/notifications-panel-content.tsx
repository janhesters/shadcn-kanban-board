import { useTranslation } from 'react-i18next';

import type { LinkNotificationProps } from './notification-components';
import { LinkNotification } from './notification-components';
import { LINK_NOTIFICATION_TYPE } from './notification-constants';

export type NotificationType = LinkNotificationProps;

type NotificationContentProps = {
  notification: NotificationType;
};

function NotificationContent({ notification }: NotificationContentProps) {
  switch (notification.type) {
    case LINK_NOTIFICATION_TYPE: {
      return <LinkNotification {...notification} />;
    }
    default: {
      return;
    }
  }
}

export type NotificationsPanelContentProps = {
  notifications: NotificationType[];
};

export function NotificationsPanelContent({
  notifications,
}: NotificationsPanelContentProps) {
  const { t } = useTranslation('notifications', {
    keyPrefix: 'notifications-panel',
  });

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-24 flex-col items-center justify-center gap-2 p-4">
        <p className="text-foreground text-lg font-semibold">
          {t('no-notifications-title')}
        </p>

        <p className="text-muted-foreground text-sm font-normal">
          {t('no-notifications-description')}
        </p>
      </div>
    );
  }

  return (
    <div className="-m-2 flex flex-col overflow-y-auto p-2 sm:max-h-96">
      {notifications.map(notification => (
        <NotificationContent
          key={notification.recipientId}
          notification={notification}
        />
      ))}
    </div>
  );
}
