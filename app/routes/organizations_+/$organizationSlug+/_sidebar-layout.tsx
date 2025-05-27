import type { ShouldRevalidateFunctionArgs, UIMatch } from 'react-router';
import { data, href, Outlet, redirect } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { allLookupKeys } from '~/features/billing/billing-constants';
import { getCreateSubscriptionModalProps } from '~/features/billing/billing-helpers.server';
import { retrieveProductsFromDatabaseByPriceLookupKeys } from '~/features/billing/stripe-product-model.server';
import { mapInitialNotificationsDataToNotificationButtonProps } from '~/features/notifications/notifications-helpers.server';
import { retrieveInitialNotificationsDataForUserAndOrganizationFromDatabaseById } from '~/features/notifications/notifications-model.server';
import { AppHeader } from '~/features/organizations/layout/app-header';
import { AppSidebar } from '~/features/organizations/layout/app-sidebar';
import { findHeaderTitle } from '~/features/organizations/layout/layout-helpers';
import {
  getSidebarState,
  mapOnboardingUserToBillingSidebarCardProps,
  mapOnboardingUserToOrganizationLayoutProps,
} from '~/features/organizations/layout/layout-helpers.server';
import { sidebarLayoutAction } from '~/features/organizations/layout/sidebar-layout-action.server';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';

import type { Route } from './+types/_sidebar-layout';

export const handle = { i18n: ['organizations', 'notifications', 'billing'] };

/**
 * @see https://reactrouter.com/start/framework/route-module#shouldrevalidate
 */
export const shouldRevalidate = ({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  if (currentParams.organizationSlug !== nextParams.organizationSlug) {
    return true;
  }
  return defaultShouldRevalidate;
};

export async function loader({ request, params }: Route.LoaderArgs) {
  if (
    params.organizationSlug &&
    request.url.endsWith(`/organizations/${params.organizationSlug}`)
  ) {
    return redirect(
      href('/organizations/:organizationSlug/dashboard', {
        organizationSlug: params.organizationSlug,
      }),
    );
  }

  const {
    auth: { user, organization, headers },
    products,
  } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    products: retrieveProductsFromDatabaseByPriceLookupKeys(
      allLookupKeys as unknown as string[],
    ),
  });
  const notificationData =
    await retrieveInitialNotificationsDataForUserAndOrganizationFromDatabaseById(
      { userId: user.id, organizationId: organization.id },
    );
  const defaultSidebarOpen = getSidebarState(request);

  return data(
    {
      headerTitle: 'React Router SaaS Template',
      defaultSidebarOpen,
      ...mapOnboardingUserToOrganizationLayoutProps({
        user,
        organizationSlug: params.organizationSlug,
      }),
      ...mapInitialNotificationsDataToNotificationButtonProps(
        notificationData!,
      ),
      ...mapOnboardingUserToBillingSidebarCardProps({
        now: new Date(),
        user,
        organizationSlug: params.organizationSlug,
      }),
      ...getCreateSubscriptionModalProps(organization, products),
    },
    { headers },
  );
}

export async function action(args: Route.ActionArgs) {
  return sidebarLayoutAction(args);
}

export default function OrganizationLayoutRoute({
  loaderData,
  params,
  matches,
}: Route.ComponentProps) {
  const {
    billingSidebarCardProps,
    createSubscriptionModalProps,
    defaultSidebarOpen,
    navUserProps,
    notificationButtonProps,
    organizationSwitcherProps,
  } = loaderData;
  const headerTitle = findHeaderTitle(
    matches as UIMatch<{ headerTitle?: string }>[],
  );

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar
        billingSidebarCardProps={
          billingSidebarCardProps && {
            ...billingSidebarCardProps,
            createSubscriptionModalProps,
          }
        }
        navUserProps={navUserProps}
        organizationSwitcherProps={organizationSwitcherProps}
        organizationSlug={params.organizationSlug}
        variant="inset"
      />

      <SidebarInset>
        <AppHeader
          notificationsButtonProps={notificationButtonProps}
          title={headerTitle}
        />

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
