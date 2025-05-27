import { CheckIcon, Loader2Icon } from 'lucide-react';
import type { ComponentProps, MouseEventHandler } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

import type { Interval, Tier } from './billing-constants';
import {
  priceLookupKeysByTierAndInterval,
  SWITCH_SUBSCRIPTION_INTENT,
} from './billing-constants';
import {
  FeatureListItem,
  FeaturesList,
  FeaturesListTitle,
  OfferBadge,
  TierCard,
  TierCardContent,
  TierCardDescription,
  TierCardHeader,
  TierCardPrice,
  TierCardTitle,
  TierContainer,
  TierGrid,
} from './pricing';

export type CancelOrModifySubscriptionModalContentProps = {
  canCancelSubscription: boolean;
  currentTier: Tier | 'enterprise';
  currentTierInterval: Interval;
  isSwitchingToHigh?: boolean;
  isSwitchingToLow?: boolean;
  isSwitchingToMid?: boolean;
  onCancelSubscriptionClick?: MouseEventHandler<HTMLButtonElement>;
};

export function CancelOrModifySubscriptionModalContent({
  canCancelSubscription = false,
  currentTier,
  currentTierInterval,
  isSwitchingToHigh = false,
  isSwitchingToLow = false,
  isSwitchingToMid = false,
  onCancelSubscriptionClick,
}: CancelOrModifySubscriptionModalContentProps) {
  const { t } = useTranslation('billing', { keyPrefix: 'pricing' });
  const { t: tModal } = useTranslation('billing', {
    keyPrefix: 'billing-page.pricing-modal',
  });
  const [billingPeriod, setBillingPeriod] = useState('annual');

  const isSubmitting =
    isSwitchingToLow || isSwitchingToMid || isSwitchingToHigh;

  // TODO: change to "Tier" - high, low, mid, enterprise
  const getFeatures = (key: string): string[] =>
    t(`plans.${key}.features`, { returnObjects: true }) as string[];

  const getButtonProps = (
    interval: 'monthly' | 'annual',
    tier: 'low' | 'mid' | 'high',
  ): Partial<ComponentProps<typeof Button>> => {
    const isCurrentTier = tier === currentTier;
    const isUpgrade =
      (currentTier === 'low' && (tier === 'mid' || tier === 'high')) ||
      (currentTier === 'mid' && tier === 'high');

    // flags for in-flight actions
    const switchingToThisTier =
      (tier === 'low' && isSwitchingToLow) ||
      (tier === 'mid' && isSwitchingToMid) ||
      (tier === 'high' && isSwitchingToHigh);

    // 1. If this is the current tier but only the billing interval is different
    if (isCurrentTier) {
      if (interval !== currentTierInterval) {
        return interval === 'annual'
          ? { children: tModal('switch-to-annual-button') }
          : {
              children: tModal('switch-to-monthly-button'),
              variant: 'outline',
            };
      }
      return {
        children: tModal('current-plan'),
        disabled: true,
        variant: 'outline',
      };
    }

    // 2. If we’re already submitting a switch for this tier, show spinner + appropriate label
    if (switchingToThisTier) {
      const label = isUpgrade ? (
        <>
          <Loader2Icon className="animate-spin" />
          {tModal('upgrading')}
        </>
      ) : (
        <>
          <Loader2Icon className="animate-spin" />
          {tModal('downgrading')}
        </>
      );

      return { children: label, ...(isUpgrade ? {} : { variant: 'outline' }) };
    }

    // 3. Default static buttons for upgrade vs downgrade
    return isUpgrade
      ? { children: tModal('upgrade-button'), disabled: isSubmitting }
      : { children: tModal('downgrade-button'), variant: 'outline' };
  };

  return (
    <>
      <Form method="post" replace>
        <fieldset disabled={isSubmitting}>
          <input
            type="hidden"
            name="intent"
            value={SWITCH_SUBSCRIPTION_INTENT}
          />

          <Tabs value={billingPeriod} onValueChange={setBillingPeriod}>
            <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row md:mb-2">
              <TabsList>
                <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
                <TabsTrigger value="annual">{t('annual')}</TabsTrigger>
              </TabsList>

              {billingPeriod === 'monthly' && (
                <p className="text-primary text-sm">{t('save-annually')}</p>
              )}
            </div>

            <TabsContent value="monthly">
              <TierContainer>
                <TierGrid>
                  {/* Low Tier */}
                  <TierCard>
                    <TierCardHeader>
                      <TierCardTitle>{t('plans.low.title')}</TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$17' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.low.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.low.monthly}
                        type="submit"
                        {...getButtonProps('monthly', 'low')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.low.features-title')}
                      </FeaturesListTitle>
                      <FeaturesList>
                        {getFeatures('low').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>

                  {/* Mid Tier */}
                  <TierCard>
                    <TierCardHeader>
                      <TierCardTitle>{t('plans.mid.title')}</TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$30' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.mid.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.mid.monthly}
                        type="submit"
                        {...getButtonProps('monthly', 'mid')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.mid.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('mid').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>

                  {/* High Tier */}
                  <TierCard className="ring-primary -mt-1.5 ring-2">
                    <TierCardHeader>
                      <TierCardTitle className="text-primary">
                        {t('plans.high.title')}
                        <Badge>{t('most-popular')}</Badge>
                      </TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$55' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.high.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.high.monthly}
                        type="submit"
                        {...getButtonProps('monthly', 'high')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.high.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('high').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>
                </TierGrid>
              </TierContainer>
            </TabsContent>

            <TabsContent value="annual">
              <TierContainer>
                <TierGrid className="@6xl/tiers:grid-cols-4">
                  {/* Low Tier */}
                  <TierCard>
                    <TierCardHeader>
                      <TierCardTitle>{t('plans.low.title')}</TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$15' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />

                        <OfferBadge>-10%</OfferBadge>
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.low.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.low.annual}
                        type="submit"
                        {...getButtonProps('annual', 'low')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.low.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('low').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>

                  {/* Mid Tier */}
                  <TierCard>
                    <TierCardHeader>
                      <TierCardTitle>{t('plans.mid.title')}</TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$25' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />

                        <OfferBadge>-15%</OfferBadge>
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.mid.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.mid.annual}
                        type="submit"
                        {...getButtonProps('annual', 'mid')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.mid.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('mid').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>

                  {/* High Tier */}
                  <TierCard className="ring-primary -mt-1.5 ring-2">
                    <TierCardHeader>
                      <TierCardTitle className="text-primary">
                        {t('plans.high.title')}
                        <Badge>{t('most-popular')}</Badge>
                      </TierCardTitle>

                      <TierCardPrice>
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$45' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />

                        <OfferBadge>-20%</OfferBadge>
                      </TierCardPrice>

                      <TierCardDescription>
                        {t('plans.high.description')}
                      </TierCardDescription>

                      <Button
                        className="w-full"
                        name="lookupKey"
                        value={priceLookupKeysByTierAndInterval.high.annual}
                        type="submit"
                        {...getButtonProps('annual', 'high')}
                      />
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.high.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('high').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>

                  {/* Enterprise Tier */}
                  <TierCard className="@4xl/tiers:col-start-2 @6xl/tiers:col-start-auto">
                    <TierCardHeader>
                      <TierCardTitle>
                        {t('plans.enterprise.title')}
                      </TierCardTitle>

                      <TierCardPrice>{t('custom')}</TierCardPrice>

                      <TierCardDescription>
                        {t('plans.enterprise.description')}
                      </TierCardDescription>

                      <Button asChild className="w-full">
                        <Link to={href('/contact-sales')}>
                          {t('plans.enterprise.cta')}
                        </Link>
                      </Button>
                    </TierCardHeader>

                    <Separator />

                    <TierCardContent>
                      <FeaturesListTitle>
                        {t('plans.enterprise.features-title')}
                      </FeaturesListTitle>

                      <FeaturesList>
                        {getFeatures('enterprise').map(feature => (
                          <FeatureListItem key={feature}>
                            <CheckIcon />
                            {feature}
                          </FeatureListItem>
                        ))}
                      </FeaturesList>
                    </TierCardContent>
                  </TierCard>
                </TierGrid>
              </TierContainer>
            </TabsContent>
          </Tabs>
        </fieldset>
      </Form>

      {canCancelSubscription && (
        <>
          <Separator />

          <div className="@container/alert">
            <Alert className="flex flex-col gap-2 @5xl/alert:block">
              <AlertTitle>
                {tModal('cancel-subscription-banner.title')}
              </AlertTitle>

              <AlertDescription>
                {tModal('cancel-subscription-banner.description')}
              </AlertDescription>

              <Button
                className="shadow-none @5xl/alert:absolute @5xl/alert:top-1/2 @5xl/alert:right-3 @5xl/alert:-translate-y-1/2"
                disabled={isSubmitting}
                onClick={onCancelSubscriptionClick}
                type="button"
                variant="outline"
              >
                {tModal('cancel-subscription-banner.button')}
              </Button>
            </Alert>
          </div>
        </>
      )}
    </>
  );
}
