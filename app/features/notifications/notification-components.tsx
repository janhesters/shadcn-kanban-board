import type { NotificationRecipient } from '@prisma/client';
import { MoreVerticalIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useFetcher } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';
import { toFormData } from '~/utils/to-form-data';

import { MARK_ONE_NOTIFICATION_AS_READ_INTENT } from './notification-constants';
import type { LinkNotificationData } from './notifications-schemas';

/**
 * Base notification stuff
 */

type NotificationsDotProps = ComponentProps<'div'> & {
  blinking: boolean;
};

export function NotificationsDot({
  blinking,
  className,
  ...props
}: NotificationsDotProps) {
  return (
    <div
      className={cn(
        'text-primary flex items-center justify-center rounded-full',
        // Position + styling depending on blinking.
        !blinking && 'bg-primary/10 p-1',
        // Only apply these reduced-motion tweaks when blinking is enabled.
        blinking && 'motion-reduce:bg-primary/10 motion-reduce:p-1',
        className,
      )}
      {...props}
    >
      {blinking && (
        <span
          className={cn(
            'bg-primary absolute size-2 animate-ping rounded-full opacity-75',
            'motion-reduce:animate-none',
          )}
        />
      )}
      <div className="size-2 rounded-full bg-current" />
    </div>
  );
}

type NotificationMenuProps = {
  recipientId: NotificationRecipient['id'];
};

export function NotificationMenu({ recipientId }: NotificationMenuProps) {
  const { t } = useTranslation('notifications', {
    keyPrefix: 'notification-menu',
  });
  const [isOpen, setIsOpen] = useState(false);
  const notificationMenuFetcher = useFetcher();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('trigger-button')}
          className={cn(
            'opacity-0 group-hover:opacity-100 group-focus:opacity-100 hover:bg-transparent focus:opacity-100 dark:hover:bg-transparent',
            isOpen && 'opacity-100',
          )}
          size="icon"
          variant="outline"
        >
          <MoreVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" side="left">
        <DropdownMenuItem
          onClick={event => {
            event.stopPropagation();
            void notificationMenuFetcher.submit(
              toFormData({
                intent: MARK_ONE_NOTIFICATION_AS_READ_INTENT,
                recipientId,
              }),
              { method: 'post' },
            );
          }}
        >
          {t('mark-as-read')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type BaseNotificationProps = {
  recipientId: NotificationRecipient['id'];
  isRead: boolean;
};

/**
 * Link notification
 */

export type LinkNotificationProps = BaseNotificationProps &
  LinkNotificationData;

export function LinkNotification({
  href,
  isRead,
  recipientId,
  text,
}: LinkNotificationProps) {
  return (
    <Button
      asChild
      className="text-muted-foreground group h-auto w-full justify-between py-2 break-words whitespace-normal"
      size="sm"
      variant="ghost"
    >
      <Link to={href}>
        {text}

        {isRead ? (
          <div className="flex h-9 min-w-15">
            {/* Fake offset to prevent layout shift when the notification is read */}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NotificationMenu recipientId={recipientId} />
            <NotificationsDot blinking={false} />
          </div>
        )}
      </Link>
    </Button>
  );
}
