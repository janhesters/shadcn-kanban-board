import {
  ChartNoAxesColumnIncreasingIcon,
  CircleHelpIcon,
  FolderIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { href } from 'react-router';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '~/components/ui/sidebar';
import type { BillingSidebarCardProps } from '~/features/billing/billing-sidebar-card';
import { BillingSidebarCard } from '~/features/billing/billing-sidebar-card';
import { cn } from '~/lib/utils';

import { NavGroup } from './nav-group';
import type { NavUserProps } from './nav-user';
import { NavUser } from './nav-user';
import type { OrganizationSwitcherProps } from './organization-switcher';
import { OrganizationSwitcher } from './organization-switcher';
import type { Route } from '.react-router/types/app/routes/organizations_+/$organizationSlug+/+types/_sidebar-layout';

type AppSidebarProps = {
  organizationSlug: Route.ComponentProps['params']['organizationSlug'];
  billingSidebarCardProps?: BillingSidebarCardProps;
  organizationSwitcherProps: OrganizationSwitcherProps;
  navUserProps: NavUserProps;
} & ComponentProps<typeof Sidebar>;

export function AppSidebar({
  billingSidebarCardProps,
  navUserProps,
  organizationSlug,
  organizationSwitcherProps,
  ...props
}: AppSidebarProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'layout.app-sidebar.nav',
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher {...organizationSwitcherProps} />
      </SidebarHeader>

      <SidebarContent>
        <NavGroup
          items={[
            {
              icon: LayoutDashboardIcon,
              title: t('app.dashboard'),
              url: href('/organizations/:organizationSlug/dashboard', {
                organizationSlug,
              }),
            },
            {
              icon: FolderIcon,
              title: t('app.projects.title'),
              items: [
                {
                  title: t('app.projects.all'),
                  url: href('/organizations/:organizationSlug/projects', {
                    organizationSlug,
                  }),
                },
                {
                  title: t('app.projects.active'),
                  url: href(
                    '/organizations/:organizationSlug/projects/active',
                    {
                      organizationSlug,
                    },
                  ),
                },
              ],
            },
            {
              icon: ChartNoAxesColumnIncreasingIcon,
              title: t('app.analytics'),
              url: href('/organizations/:organizationSlug/analytics', {
                organizationSlug,
              }),
            },
          ]}
          title={t('app.title')}
        />

        {billingSidebarCardProps && (
          <BillingSidebarCard
            className={cn(
              'mt-auto overflow-hidden transition-[opacity,transform,max-height] ease-in-out',
              'max-h-[500px] scale-100 opacity-100 delay-200 duration-500',
              'group-data-[state=collapsed]:max-h-0 group-data-[state=collapsed]:scale-95 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:delay-0 group-data-[state=collapsed]:duration-200 group-data-[variant=sidebar]:mx-2',
            )}
            {...billingSidebarCardProps}
          />
        )}

        <NavGroup
          className={cn(!billingSidebarCardProps && 'mt-auto')}
          items={[
            {
              title: t('settings.organization-settings'),
              url: href('/organizations/:organizationSlug/settings', {
                organizationSlug,
              }),
              icon: SettingsIcon,
            },
            {
              title: t('settings.get-help'),
              url: href('/organizations/:organizationSlug/get-help', {
                organizationSlug,
              }),
              icon: CircleHelpIcon,
            },
          ]}
          size="sm"
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser {...navUserProps} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
