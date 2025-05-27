import type { Organization } from '@prisma/client';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CircleXIcon, Loader2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link, useNavigation } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

import type { Interval, Tier } from './billing-constants';
import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  priceLookupKeysByTierAndInterval,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from './billing-constants';
import type { CancelOrModifySubscriptionModalContentProps } from './cancel-or-modify-subscription-modal-content';
import { CancelOrModifySubscriptionModalContent } from './cancel-or-modify-subscription-modal-content';
import {
  CreateSubscriptionModalContent,
  type CreateSubscriptionModalContentProps,
} from './create-subscription-modal-content';
import {
  DescriptionDetail,
  DescriptionList,
  DescriptionListRow,
  DescriptionTerm,
} from './description-list';
import { EditBillingEmailModalContent } from './edit-billing-email-modal-content';

type PendingDowngradeBannerProps = {
  pendingTier: Tier;
  pendingInterval: Interval;
  pendingChangeDate: Date;
  isKeepingCurrentSubscription?: boolean;
  isSubmitting?: boolean;
};

function PendingDowngradeBanner({
  pendingChangeDate,
  pendingInterval,
  pendingTier,
  isKeepingCurrentSubscription,
  isSubmitting,
}: PendingDowngradeBannerProps) {
  const { t, i18n } = useTranslation('billing', {
    keyPrefix: 'billing-page.pending-downgrade-banner',
  });
  const { t: tTier } = useTranslation('billing', {
    keyPrefix: 'pricing.plans',
  });

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(pendingChangeDate));
  }, [pendingChangeDate, i18n.language]);

  return (
    <Form className="@container/alert" method="POST" replace>
      <Alert className="flex flex-col gap-2 @4xl/alert:block">
        <AlertTitle>{t('title')}</AlertTitle>

        <AlertDescription>
          {t('description', {
            date: formattedDate,
            planName: tTier(`${pendingTier}.title`),
            billingInterval: t(`intervals.${pendingInterval}`),
          })}
        </AlertDescription>

        <Button
          className="shadow-none @4xl/alert:absolute @4xl/alert:top-1/2 @4xl/alert:right-3 @4xl/alert:-translate-y-1/2"
          disabled={isSubmitting}
          name="intent"
          size="sm"
          type="submit"
          value={KEEP_CURRENT_SUBSCRIPTION_INTENT}
        >
          {isKeepingCurrentSubscription ? (
            <>
              <Loader2Icon className="animate-spin" />
              {t('loading-button')}
            </>
          ) : (
            t('button')
          )}
        </Button>
      </Alert>
    </Form>
  );
}

export type BillingPageProps = {
  billingEmail: Organization['billingEmail'];
  cancelAtPeriodEnd: boolean;
  cancelOrModifySubscriptionModalProps: CancelOrModifySubscriptionModalContentProps;
  createSubscriptionModalProps: CreateSubscriptionModalContentProps;
  currentMonthlyRatePerUser: number;
  /**
   * During trial, this is the trial end date.
   * Otherwise, this is the end of the current period.
   */
  currentPeriodEnd: Date;
  currentSeats: number;
  currentTier: Tier;
  currentInterval: Interval;
  isCancellingSubscription?: boolean;
  isEnterprisePlan: boolean;
  isKeepingCurrentSubscription?: boolean;
  isOnFreeTrial: boolean;
  isResumingSubscription?: boolean;
  isViewingInvoices?: boolean;
  maxSeats: number;
  organizationSlug: string;
  pendingChange?: PendingDowngradeBannerProps;
  projectedTotal: number;
  subscriptionStatus: 'active' | 'inactive' | 'paused';
};

export function BillingPage({
  billingEmail,
  cancelAtPeriodEnd,
  cancelOrModifySubscriptionModalProps,
  createSubscriptionModalProps,
  currentMonthlyRatePerUser,
  currentPeriodEnd,
  currentSeats,
  currentTier,
  currentInterval,
  isCancellingSubscription = false,
  isKeepingCurrentSubscription = false,
  isOnFreeTrial,
  isResumingSubscription = false,
  isViewingInvoices = false,
  maxSeats,
  organizationSlug,
  pendingChange,
  projectedTotal,
  subscriptionStatus,
}: BillingPageProps) {
  const { t, i18n } = useTranslation('billing', { keyPrefix: 'billing-page' });
  const { t: tTier } = useTranslation('billing', {
    keyPrefix: 'pricing.plans',
  });
  const [isPlanManagementModalOpen, setIsPlanManagementModalOpen] =
    useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(currentPeriodEnd));
  }, [currentPeriodEnd, i18n.language]);

  const isSubmitting =
    isCancellingSubscription ||
    isKeepingCurrentSubscription ||
    isResumingSubscription ||
    isViewingInvoices;

  /* Switch subscription */
  const navigation = useNavigation();
  const isSwitchingToHigh =
    navigation.formData?.get('intent') === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.high.annual,
        priceLookupKeysByTierAndInterval.high.monthly,
      ] as string[]
    ).includes(navigation.formData?.get('lookupKey') as string);
  const isSwitchingToLow =
    navigation.formData?.get('intent') === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.low.annual,
        priceLookupKeysByTierAndInterval.low.monthly,
      ] as string[]
    ).includes(navigation.formData?.get('lookupKey') as string);
  const isSwitchingToMid =
    navigation.formData?.get('intent') === SWITCH_SUBSCRIPTION_INTENT &&
    (
      [
        priceLookupKeysByTierAndInterval.mid.annual,
        priceLookupKeysByTierAndInterval.mid.monthly,
      ] as string[]
    ).includes(navigation.formData?.get('lookupKey') as string);

  /* Update billing email */
  const isUpdatingBillingEmail =
    navigation.formData?.get('intent') === UPDATE_BILLING_EMAIL_INTENT;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t('page-title')}</h2>

          <p className="text-muted-foreground text-sm">
            {t('page-description')}
          </p>
        </div>

        <Separator />

        {subscriptionStatus === 'inactive' ? (
          <Dialog>
            <div className="@container/alert">
              <Alert
                className="flex flex-col gap-2 @xl/alert:block"
                variant="destructive"
              >
                <AlertTitle>
                  {t('subscription-cancelled-banner.title')}
                </AlertTitle>

                <AlertDescription>
                  {t('subscription-cancelled-banner.description')}
                </AlertDescription>

                <DialogTrigger asChild>
                  <Button
                    className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                    size="sm"
                  >
                    {t('subscription-cancelled-banner.button')}
                  </Button>
                </DialogTrigger>
              </Alert>
            </div>

            <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
              <DialogHeader>
                <DialogTitle>
                  {t('subscription-cancelled-banner.modal.title')}
                </DialogTitle>

                <VisuallyHidden>
                  <DialogDescription>
                    {t('subscription-cancelled-banner.modal.description')}
                  </DialogDescription>
                </VisuallyHidden>
              </DialogHeader>

              <CreateSubscriptionModalContent
                {...createSubscriptionModalProps}
              />
            </DialogContent>
          </Dialog>
        ) : cancelAtPeriodEnd ? (
          <Form className="@container/alert" method="POST" replace>
            <Alert
              className="flex flex-col gap-2 @xl/alert:block"
              variant="destructive"
            >
              <AlertTitle>{t('cancel-at-period-end-banner.title')}</AlertTitle>

              <AlertDescription>
                {t('cancel-at-period-end-banner.description', {
                  date: formattedDate,
                })}
              </AlertDescription>

              <Button
                className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                disabled={isSubmitting}
                name="intent"
                size="sm"
                type="submit"
                value={RESUME_SUBSCRIPTION_INTENT}
              >
                {isResumingSubscription ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('cancel-at-period-end-banner.resuming-subscription')}
                  </>
                ) : (
                  t('cancel-at-period-end-banner.button')
                )}
              </Button>
            </Alert>
          </Form>
        ) : pendingChange ? (
          <PendingDowngradeBanner
            {...pendingChange}
            isKeepingCurrentSubscription={isKeepingCurrentSubscription}
            isSubmitting={isSubmitting}
          />
        ) : (
          isOnFreeTrial && (
            <Dialog>
              <div className="@container/alert">
                <Alert className="flex flex-col gap-2 @xl/alert:block">
                  <AlertTitle>{t('free-trial-banner.title')}</AlertTitle>

                  <AlertDescription>
                    {t('free-trial-banner.description', {
                      date: formattedDate,
                    })}
                  </AlertDescription>

                  <DialogTrigger asChild>
                    <Button
                      className="shadow-none @xl/alert:absolute @xl/alert:top-1/2 @xl/alert:right-3 @xl/alert:-translate-y-1/2"
                      size="sm"
                    >
                      {t('free-trial-banner.button')}
                    </Button>
                  </DialogTrigger>
                </Alert>
              </div>

              <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
                <DialogHeader>
                  <DialogTitle>
                    {t('free-trial-banner.modal.title')}
                  </DialogTitle>

                  <VisuallyHidden>
                    <DialogDescription>
                      {t('free-trial-banner.modal.description')}
                    </DialogDescription>
                  </VisuallyHidden>
                </DialogHeader>

                <CreateSubscriptionModalContent
                  {...createSubscriptionModalProps}
                />
              </DialogContent>
            </Dialog>
          )
        )}

        <div>
          <h3 className="text-base font-medium">
            {t('plan-information.heading')}
          </h3>

          <Form method="POST" replace>
            <fieldset className="@container/form" disabled={isSubmitting}>
              <Card className="mt-2 py-4 shadow-xs md:py-3">
                <DescriptionList>
                  {/* Current Plan */}
                  <DescriptionListRow className="flex-col @xl/form:grid @xl/form:grid-cols-[auto_1fr]">
                    <div className="flex items-center justify-between">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.current-plan')}
                      </DescriptionTerm>

                      <Button
                        className="@xl/form:hidden"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t('plan-information.manage-plan')}
                      </Button>
                    </div>

                    <div className="@xl/form:flex @xl/form:items-center @xl/form:justify-between">
                      <div className="flex items-center justify-between @xl/form:block">
                        <DescriptionDetail>
                          {tTier(`${currentTier}.title`)}
                        </DescriptionDetail>

                        <DescriptionDetail>
                          <Trans
                            components={{
                              1: <span className="text-muted-foreground" />,
                            }}
                            i18nKey={
                              currentInterval === 'monthly'
                                ? 'billing:billing-page.plan-information.rate-format-monthly'
                                : 'billing:billing-page.plan-information.rate-format-annual'
                            }
                            values={{ amount: currentMonthlyRatePerUser }}
                          />
                        </DescriptionDetail>
                      </div>

                      <Button
                        className="hidden @xl/form:block"
                        onClick={() => setIsPlanManagementModalOpen(true)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {t('plan-information.manage-plan')}
                      </Button>
                    </div>
                  </DescriptionListRow>

                  <Separator />

                  {/* Users */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10">
                    <div className="flex flex-col gap-2 @xl/form:flex-row">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.users')}
                      </DescriptionTerm>

                      <DescriptionDetail
                        className={cn(
                          currentSeats > maxSeats && 'text-destructive',
                        )}
                      >
                        {t('plan-information.users-format', {
                          current: currentSeats,
                          max: maxSeats,
                        })}
                      </DescriptionDetail>
                    </div>

                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={href(
                          '/organizations/:organizationSlug/settings/members',
                          { organizationSlug },
                        )}
                      >
                        {t('plan-information.manage-users')}
                      </Link>
                    </Button>
                  </DescriptionListRow>

                  <Separator />

                  {/* Projected Total */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10 @xl/form:justify-start">
                    <DescriptionTerm className="@xl/form:w-36">
                      {t('plan-information.projected-total')}
                    </DescriptionTerm>

                    <DescriptionDetail>
                      {t('plan-information.amount-format', {
                        amount: projectedTotal,
                      })}
                    </DescriptionDetail>
                  </DescriptionListRow>

                  <Separator />

                  {/* Next Billing Date */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10">
                    <div className="flex flex-col gap-2 @xl/form:flex-row">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('plan-information.next-billing-date')}
                      </DescriptionTerm>

                      <DescriptionDetail>{formattedDate}</DescriptionDetail>
                    </div>

                    <Button
                      disabled={isOnFreeTrial}
                      name="intent"
                      size="sm"
                      type="submit"
                      value={VIEW_INVOICES_INTENT}
                      variant="outline"
                    >
                      {isViewingInvoices ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          {t('opening-customer-portal')}
                        </>
                      ) : (
                        t('plan-information.view-invoices')
                      )}
                    </Button>
                  </DescriptionListRow>
                </DescriptionList>
              </Card>
            </fieldset>
          </Form>
        </div>

        {billingEmail && (
          <div>
            <h3 className="text-base font-medium">
              {t('payment-information.heading')}
            </h3>

            <div className="@container/form">
              <Card className="mt-2 py-4 shadow-xs md:py-3">
                <DescriptionList>
                  {/* Billing Email */}
                  <DescriptionListRow className="items-center justify-between @xl/form:h-10">
                    <div className="flex flex-col gap-2 @xl/form:flex-row">
                      <DescriptionTerm className="@xl/form:w-36">
                        {t('payment-information.billing-email')}
                      </DescriptionTerm>

                      <DescriptionDetail>{billingEmail}</DescriptionDetail>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          {t('payment-information.edit-button')}
                        </Button>
                      </DialogTrigger>

                      <EditBillingEmailModalContent
                        billingEmail={billingEmail}
                        isUpdatingBillingEmail={isUpdatingBillingEmail}
                      />
                    </Dialog>
                  </DescriptionListRow>
                </DescriptionList>
              </Card>
            </div>
          </div>
        )}

        <Dialog
          open={isPlanManagementModalOpen}
          onOpenChange={setIsPlanManagementModalOpen}
        >
          <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
            <DialogHeader>
              <DialogTitle>{t('pricing-modal.title')}</DialogTitle>

              <VisuallyHidden>
                <DialogDescription>
                  {t('pricing-modal.description')}
                </DialogDescription>
              </VisuallyHidden>
            </DialogHeader>

            {subscriptionStatus === 'active' && !isOnFreeTrial ? (
              <CancelOrModifySubscriptionModalContent
                {...cancelOrModifySubscriptionModalProps}
                isSwitchingToHigh={isSwitchingToHigh}
                isSwitchingToLow={isSwitchingToLow}
                isSwitchingToMid={isSwitchingToMid}
                onCancelSubscriptionClick={() => {
                  setIsPlanManagementModalOpen(false);
                  setIsCancelModalOpen(true);
                }}
              />
            ) : (
              <CreateSubscriptionModalContent
                {...createSubscriptionModalProps}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel subscription */}
        <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cancel-subscription-modal.title')}</DialogTitle>

              <DialogDescription>
                {t('cancel-subscription-modal.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ul className="flex flex-col gap-2">
                {(
                  t('cancel-subscription-modal.features', {
                    returnObjects: true,
                  }) as string[]
                ).map(feature => (
                  <li className="flex items-center gap-2" key={feature}>
                    <CircleXIcon className="text-destructive size-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter>
              <Button
                disabled={isSubmitting}
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setIsPlanManagementModalOpen(true);
                }}
                variant="outline"
              >
                {t('cancel-subscription-modal.change-plan')}
              </Button>

              <Form method="POST" replace>
                <Button
                  disabled={isSubmitting}
                  name="intent"
                  value={CANCEL_SUBSCRIPTION_INTENT}
                  variant="destructive"
                  type="submit"
                >
                  {isCancellingSubscription ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('cancel-subscription-modal.cancelling-subscription')}
                    </>
                  ) : (
                    t('cancel-subscription-modal.confirm')
                  )}
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
