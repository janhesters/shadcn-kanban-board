import { OrganizationMembershipRole } from '@prisma/client';
import { data, redirect } from 'react-router';
import { promiseHash } from 'remix-utils/promise';
import { z } from 'zod';

import { combineHeaders } from '~/utils/combine-headers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { requestToUrl } from '~/utils/get-search-parameter-from-request.server';
import { badRequest, conflict, forbidden } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { createToastHeaders } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import type { Route } from '../../routes/organizations_+/$organizationSlug+/settings+/+types/billing';
import { requireUserIsMemberOfOrganization } from '../organizations/organizations-helpers.server';
import { updateOrganizationInDatabaseById } from '../organizations/organizations-model.server';
import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  OPEN_CHECKOUT_SESSION_INTENT,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from './billing-constants';
import { extractBaseUrl } from './billing-helpers.server';
import {
  cancelSubscriptionSchema,
  keepCurrentSubscriptionSchema,
  openCustomerCheckoutSessionSchema,
  resumeSubscriptionSchema,
  switchSubscriptionSchema,
  updateBillingEmailSchema,
  viewInvoicesSchema,
} from './billing-schemas';
import {
  createStripeCancelSubscriptionSession,
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  createStripeSwitchPlanSession,
  keepCurrentSubscription,
  resumeStripeSubscription,
  updateStripeCustomer,
} from './stripe-helpers.server';
import {
  retrieveStripePriceFromDatabaseByLookupKey,
  retrieveStripePriceWithProductFromDatabaseByLookupKey,
} from './stripe-prices-model.server';
import { updateStripeSubscriptionInDatabaseById } from './stripe-subscription-model.server';
import { deleteStripeSubscriptionScheduleFromDatabaseById } from './stripe-subscription-schedule-model.server';

const schema = z.discriminatedUnion('intent', [
  cancelSubscriptionSchema,
  keepCurrentSubscriptionSchema,
  openCustomerCheckoutSessionSchema,
  resumeSubscriptionSchema,
  switchSubscriptionSchema,
  updateBillingEmailSchema,
  viewInvoicesSchema,
]);

export async function billingAction({ request, params }: Route.ActionArgs) {
  try {
    const {
      auth: { organization, headers, role, user },
      t,
    } = await promiseHash({
      auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
      t: i18next.getFixedT(request, 'billing', { keyPrefix: 'billing-page' }),
    });
    const body = await validateFormData(request, schema);

    if (role === OrganizationMembershipRole.member) {
      return forbidden();
    }

    const baseUrl = extractBaseUrl(requestToUrl(request));

    switch (body.intent) {
      case CANCEL_SUBSCRIPTION_INTENT: {
        if (!organization.stripeCustomerId) {
          throw new Error('Organization has no Stripe customer ID');
        }

        const cancelSession = await createStripeCancelSubscriptionSession({
          baseUrl,
          customerId: organization.stripeCustomerId,
          organizationSlug: params.organizationSlug,
          subscriptionId: organization.stripeSubscriptions[0].stripeId,
        });

        return redirect(cancelSession.url);
      }

      case KEEP_CURRENT_SUBSCRIPTION_INTENT: {
        const currentSubscription = organization.stripeSubscriptions[0];

        if (!currentSubscription) {
          throw new Error('Organization has no Stripe subscriptions');
        }

        if (currentSubscription.schedule) {
          const schedule = await keepCurrentSubscription(
            currentSubscription.schedule.stripeId,
          );

          await deleteStripeSubscriptionScheduleFromDatabaseById(schedule.id);
        }

        const toast = await createToastHeaders({
          title: t('pending-downgrade-banner.success-title'),
          type: 'success',
        });

        return data({}, { headers: combineHeaders(toast, headers) });
      }

      case OPEN_CHECKOUT_SESSION_INTENT: {
        if (organization.stripeSubscriptions[0]) {
          return conflict();
        }

        const price =
          await retrieveStripePriceWithProductFromDatabaseByLookupKey(
            body.lookupKey,
          );

        if (!price) {
          throw new Error('Price not found');
        }

        if (organization._count.memberships > price.product.maxSeats) {
          return conflict();
        }

        const checkoutSession = await createStripeCheckoutSession({
          baseUrl,
          customerEmail: organization.billingEmail,
          customerId: organization.stripeCustomerId,
          organizationId: organization.id,
          organizationSlug: organization.slug,
          priceId: price.stripeId,
          purchasedById: user.id,
          seatsUsed: organization._count.memberships,
        });

        return redirect(checkoutSession.url!);
      }

      case RESUME_SUBSCRIPTION_INTENT: {
        const currentSubscription = organization.stripeSubscriptions[0];

        if (!currentSubscription) {
          throw new Error('Organization has no Stripe subscriptions');
        }

        const subscription = await resumeStripeSubscription(
          organization.stripeSubscriptions[0].stripeId,
        );

        if (
          subscription.cancel_at_period_end !==
          currentSubscription.cancelAtPeriodEnd
        ) {
          await updateStripeSubscriptionInDatabaseById({
            id: subscription.id,
            subscription: { cancelAtPeriodEnd: false },
          });
        }

        const toast = await createToastHeaders({
          title: t('cancel-at-period-end-banner.resume-success-title'),
          type: 'success',
        });

        return data({}, { headers: combineHeaders(toast, headers) });
      }

      case SWITCH_SUBSCRIPTION_INTENT: {
        if (!organization.stripeCustomerId) {
          throw new Error('Organization has no Stripe customer ID');
        }

        if (!organization.stripeSubscriptions[0]) {
          throw new Error('Organization has no Stripe subscriptions');
        }

        const price = await retrieveStripePriceFromDatabaseByLookupKey(
          body.lookupKey,
        );

        if (!price) {
          return badRequest({ message: 'Price not found' });
        }

        const portalSession = await createStripeSwitchPlanSession({
          baseUrl,
          customerId: organization.stripeCustomerId,
          organizationSlug: params.organizationSlug,
          subscriptionId: organization.stripeSubscriptions[0].stripeId,
          subscriptionItemId:
            organization.stripeSubscriptions[0].items[0].stripeId,
          newPriceId: price.stripeId,
          quantity: organization._count.memberships,
        });

        return redirect(portalSession.url);
      }

      case UPDATE_BILLING_EMAIL_INTENT: {
        if (!organization.stripeCustomerId) {
          throw new Error('Organization has no Stripe customer ID');
        }

        if (body.billingEmail !== organization.billingEmail) {
          await updateStripeCustomer({
            customerId: organization.stripeCustomerId,
            customerEmail: body.billingEmail,
            customerName: organization.name,
          });

          await updateOrganizationInDatabaseById({
            id: organization.id,
            organization: { billingEmail: body.billingEmail },
          });
        }

        const toast = await createToastHeaders({
          title: t('update-billing-email-modal.success-title'),
          type: 'success',
        });

        return data({}, { headers: combineHeaders(toast, headers) });
      }

      case VIEW_INVOICES_INTENT: {
        if (!organization.stripeCustomerId) {
          throw new Error('Organization has no Stripe customer ID');
        }

        const portalSession = await createStripeCustomerPortalSession({
          baseUrl,
          customerId: organization.stripeCustomerId,
          organizationSlug: params.organizationSlug,
        });

        return redirect(portalSession.url);
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
