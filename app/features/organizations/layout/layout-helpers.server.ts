import { type Organization, OrganizationMembershipRole } from '@prisma/client';

import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import { getTierAndIntervalForLookupKey } from '~/features/billing/billing-helpers';
import type { BillingSidebarCardProps } from '~/features/billing/billing-sidebar-card';
import type { OnboardingUser } from '~/features/onboarding/onboarding-helpers.server';

import type { NavUserProps } from './nav-user';
import type { OrganizationSwitcherProps } from './organization-switcher';

/**
 * Gets the sidebar state from the request cookies. This is used to determine
 * whether to server render the sidebar open or closed.
 *
 * @param request - The request object containing cookies
 * @returns boolean - The sidebar state (true if sidebar_state cookie is "true",
 * false otherwise).
 */
export function getSidebarState(request: Request): boolean {
  const cookies = request.headers.get('cookie') ?? '';
  const sidebarState = cookies
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('sidebar_state='))
    ?.split('=')[1];

  // Return true by default if no cookie is found
  if (!sidebarState) return true;

  return sidebarState === 'true';
}

/**
 * Maps an onboarding user to the organization layout props.
 * @param user - The onboarding user to map
 * @returns The organization layout props containing organizations and user data
 */
export function mapOnboardingUserToOrganizationLayoutProps({
  user,
  organizationSlug,
}: {
  user: OnboardingUser;
  organizationSlug: Organization['slug'];
}): {
  navUserProps: NavUserProps;
  organizationSwitcherProps: OrganizationSwitcherProps;
} {
  const mappedOrganizations = user.memberships.map(membership => ({
    id: membership.organization.id,
    name: membership.organization.name,
    logo: membership.organization.imageUrl,
    slug: membership.organization.slug,
    tier: getTierAndIntervalForLookupKey(
      // Actual plan if the organization has a subscription.
      membership.organization.stripeSubscriptions.length > 0
        ? membership.organization.stripeSubscriptions[0].items[0].price
            .lookupKey
        : // Default plan during the trial period.
          priceLookupKeysByTierAndInterval.high.annual,
    ).tier,
  }));

  return {
    navUserProps: {
      user: {
        avatar: user.imageUrl,
        email: user.email,
        name: user.name,
      },
    },
    organizationSwitcherProps: {
      currentOrganization: mappedOrganizations.find(
        organization => organization.slug === organizationSlug,
      ),
      organizations: mappedOrganizations,
    },
  };
}

export function mapOnboardingUserToBillingSidebarCardProps({
  now,
  organizationSlug,
  user,
}: {
  now: Date;
  organizationSlug: Organization['slug'];
  user: OnboardingUser;
}): {
  billingSidebarCardProps?: Omit<
    BillingSidebarCardProps,
    'createSubscriptionModalProps'
  >;
} {
  const currentMembership = user.memberships.find(
    membership => membership.organization.slug === organizationSlug,
  );

  if (!currentMembership) {
    return {};
  }

  const currentOrganization = currentMembership?.organization;

  if (!currentOrganization) {
    return {};
  }

  const showButton =
    currentMembership.role === OrganizationMembershipRole.admin ||
    currentMembership.role === OrganizationMembershipRole.owner;

  if (currentOrganization.stripeSubscriptions.length > 0) {
    const subscription = currentOrganization.stripeSubscriptions[0];
    const isCancelled = subscription.status === 'canceled';
    return isCancelled
      ? {
          billingSidebarCardProps: {
            showButton,
            state: 'cancelled',
            trialEndDate: new Date(),
          },
        }
      : {};
  }

  return {
    billingSidebarCardProps: {
      showButton,
      state: now < currentOrganization.trialEnd ? 'trialing' : 'trialEnded',
      trialEndDate: currentOrganization.trialEnd,
    },
  };
}

/**
 * Switches the slug in the route with the given slug.
 *
 * @param route - The route to switch the slug in
 * @param slug - The slug to switch in the route
 * @returns The route with the slug switched
 */
export function switchSlugInRoute(route: string, slug: Organization['slug']) {
  return route.replace(/\/organizations\/[^/]+/, `/organizations/${slug}`);
}
