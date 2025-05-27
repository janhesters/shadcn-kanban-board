import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetcher } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { toFormData } from '~/utils/to-form-data';

import { NotificationsDot } from './notification-components';
import {
  MARK_ALL_NOTIFICATIONS_AS_READ_INTENT,
  NOTIFICATION_PANEL_OPENED_INTENT,
} from './notification-constants';
import type { NotificationsPanelContentProps } from './notifications-panel-content';
import { NotificationsPanelContent } from './notifications-panel-content';
import { usePendingNotifications } from './use-pending-notifications';

export type NotificationsButtonProps = {
  allNotifications: NotificationsPanelContentProps['notifications'];
  showBadge: boolean;
  unreadNotifications: NotificationsPanelContentProps['notifications'];
};

export function NotificationsButton({
  allNotifications,
  showBadge,
  unreadNotifications,
}: NotificationsButtonProps) {
  const { t } = useTranslation('notifications', {
    keyPrefix: 'notifications-button',
  });

  /* Notification panel opened state */
  const [popoverOpen, setPopoverOpen] = useState(false);
  const notificationPanelOpenedFetcher = useFetcher();
  const notificationPanelOpened =
    notificationPanelOpenedFetcher.formData?.get('intent') ===
    NOTIFICATION_PANEL_OPENED_INTENT;

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);

    if (open) {
      void notificationPanelOpenedFetcher.submit(
        toFormData({ intent: NOTIFICATION_PANEL_OPENED_INTENT }),
        { method: 'post' },
      );
    }
  };

  /* Mark all as read */
  const markAllAsReadFetcher = useFetcher();
  const isMarkingAllAsRead =
    markAllAsReadFetcher.formData?.get('intent') ===
    MARK_ALL_NOTIFICATIONS_AS_READ_INTENT;
  // Optimistically hide badge when the panel is opened.
  const optimisticShowBadge = showBadge && !notificationPanelOpened;

  /* Mark one as read */
  const pendingNotifications = usePendingNotifications();

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label={
            optimisticShowBadge
              ? t('open-unread-notifications')
              : t('open-notifications')
          }
          className="relative size-8"
          size="icon"
          variant="outline"
        >
          <BellIcon />
          {optimisticShowBadge && (
            <NotificationsDot
              blinking={true}
              className="absolute -top-0.5 -right-0.5 motion-reduce:-top-1.5 motion-reduce:-right-1.5"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        aria-labelledby="notifications-header"
        className="min-w-svw p-2 sm:w-md sm:min-w-[unset]"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold" id="notifications-header">
            {t('notifications')}
          </p>

          <Tooltip>
            <markAllAsReadFetcher.Form method="post">
              <TooltipTrigger asChild>
                <Button
                  aria-label={t('mark-all-as-read')}
                  name="intent"
                  size="sm"
                  type="submit"
                  value={MARK_ALL_NOTIFICATIONS_AS_READ_INTENT}
                  variant="ghost"
                >
                  <CheckCheckIcon />
                </Button>
              </TooltipTrigger>
            </markAllAsReadFetcher.Form>

            <TooltipContent side="bottom">
              {t('mark-all-as-read')}
            </TooltipContent>
          </Tooltip>
        </div>

        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">{t('unread')}</TabsTrigger>

            <TabsTrigger value="all">{t('all')}</TabsTrigger>
          </TabsList>

          <div className="-mx-2">
            <Separator />
          </div>

          <TabsContent value="unread">
            <NotificationsPanelContent
              // Optimistically hide notifications when marking all as read.
              notifications={
                isMarkingAllAsRead
                  ? []
                  : // Optimistically hide notification when marking one as read.
                    unreadNotifications.filter(
                      notification =>
                        !pendingNotifications.some(
                          pending =>
                            pending.recipientId === notification.recipientId,
                        ),
                    )
              }
            />
          </TabsContent>

          <TabsContent value="all">
            <NotificationsPanelContent
              notifications={
                isMarkingAllAsRead
                  ? // Optimistically mark all notifications as read when marking all as read.
                    allNotifications.map(notification => ({
                      ...notification,
                      isRead: true,
                    }))
                  : // Optimistically mark specific notifications as read when marking one as read.
                    allNotifications.map(notification => ({
                      ...notification,
                      isRead: pendingNotifications.some(
                        pending =>
                          pending.recipientId === notification.recipientId,
                      ),
                    }))
              }
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
