import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { ThemeToggle } from '~/features/color-scheme/theme-toggle';
import type { NotificationsButtonProps } from '~/features/notifications/notifications-button';
import { NotificationsButton } from '~/features/notifications/notifications-button';

export type AppHeaderProps = {
  notificationsButtonProps: NotificationsButtonProps;
  title?: string;
};

export function AppHeader({ notificationsButtonProps, title }: AppHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1.5" />

        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        {title && <h1 className="text-base font-medium">{title}</h1>}

        <div className="ml-auto flex items-center gap-2">
          <NotificationsButton {...notificationsButtonProps} />

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
