import { OrganizationMembershipRole } from '@prisma/client';
import { data, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { billingAction } from '~/features/billing/billing-action.server';
import {
  allLookupKeys,
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  RESUME_SUBSCRIPTION_INTENT,
  VIEW_INVOICES_INTENT,
} from '~/features/billing/billing-constants';
import {
  getCreateSubscriptionModalProps,
  mapStripeSubscriptionDataToBillingPageProps,
} from '~/features/billing/billing-helpers.server';
import { BillingPage } from '~/features/billing/billing-page';
import { retrieveProductsFromDatabaseByPriceLookupKeys } from '~/features/billing/stripe-product-model.server';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { getPageTitle } from '~/utils/get-page-title.server';
import { notFound } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/billing';

export const handle = { i18n: 'billing' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const {
    auth: { organization, headers, role },
    products,
    t,
  } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    products: retrieveProductsFromDatabaseByPriceLookupKeys(
      allLookupKeys as unknown as string[],
    ),
    t: i18next.getFixedT(request, ['billing', 'common']),
  });

  if (role === OrganizationMembershipRole.member) {
    throw notFound();
  }

  return data(
    {
      billingPageProps: {
        ...mapStripeSubscriptionDataToBillingPageProps({
          organization,
          now: new Date(),
        }),
        ...getCreateSubscriptionModalProps(organization, products),
      },
      title: getPageTitle(t, 'billing-page.page-title'),
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await billingAction(args);
}

export default function OrganizationBillingSettingsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { billingPageProps } = loaderData;

  const navigation = useNavigation();
  const isCancellingSubscription =
    navigation.formData?.get('intent') === CANCEL_SUBSCRIPTION_INTENT;
  const isKeepingCurrentSubscription =
    navigation.formData?.get('intent') === KEEP_CURRENT_SUBSCRIPTION_INTENT;
  const isResumingSubscription =
    navigation.formData?.get('intent') === RESUME_SUBSCRIPTION_INTENT;
  const isViewingInvoices =
    navigation.formData?.get('intent') === VIEW_INVOICES_INTENT;

  return (
    <BillingPage
      {...billingPageProps}
      isCancellingSubscription={isCancellingSubscription}
      isKeepingCurrentSubscription={isKeepingCurrentSubscription}
      isResumingSubscription={isResumingSubscription}
      isViewingInvoices={isViewingInvoices}
    />
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
