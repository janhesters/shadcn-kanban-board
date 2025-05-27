import { OrganizationMembershipRole } from '@prisma/client';
import { useTranslation } from 'react-i18next';
import { href, Link, Outlet, useLocation } from 'react-router';
import { redirect } from 'react-router';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '~/components/ui/navigation-menu';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';

import type { Route } from './+types/_organization-settings-layout';

export const handle = { i18n: 'organizations' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const pathname = new URL(request.url).pathname;
  if (pathname.endsWith('/settings')) {
    return redirect(pathname + '/general');
  }

  const { role } = await requireUserIsMemberOfOrganization(
    request,
    params.organizationSlug,
  );

  return {
    headerTitle: 'Organization Settings',
    showBilling:
      role === OrganizationMembershipRole.admin ||
      role === OrganizationMembershipRole.owner,
  };
}

export default function OrganizationSettingsLayout({
  loaderData,
  params,
}: Route.ComponentProps) {
  const pathname = useLocation().pathname;
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.layout',
  });
  const routes = [
    {
      title: t('general'),
      url: href('/organizations/:organizationSlug/settings/general', {
        organizationSlug: params.organizationSlug,
      }),
    },
    {
      title: t('team-members'),
      url: href('/organizations/:organizationSlug/settings/members', {
        organizationSlug: params.organizationSlug,
      }),
    },
    ...(loaderData.showBilling
      ? [
          {
            title: t('billing'),
            url: href('/organizations/:organizationSlug/settings/billing', {
              organizationSlug: params.organizationSlug,
            }),
          },
        ]
      : []),
  ];

  return (
    <>
      <div
        className="flex h-[calc(var(--header-height)-0.5rem)] items-center border-b px-4 lg:px-6"
        data-slot="secondary-sidebar-header"
      >
        <NavigationMenu aria-label={t('settings-nav')} className="-ml-1.5">
          <NavigationMenuList className="gap-2 *:data-[slot=navigation-menu-item]:h-7 **:data-[slot=navigation-menu-link]:py-1 **:data-[slot=navigation-menu-link]:font-medium">
            {routes.map(route => (
              <NavigationMenuItem key={route.url}>
                <NavigationMenuLink
                  asChild
                  data-active={pathname === route.url}
                >
                  <Link to={route.url}>{route.title}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <Outlet />
    </>
  );
}
