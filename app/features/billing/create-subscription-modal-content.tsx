import { CheckIcon, Loader2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link, useNavigation } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

import type { Interval, Tier } from './billing-constants';
import {
  OPEN_CHECKOUT_SESSION_INTENT,
  priceLookupKeysByTierAndInterval,
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

export type CreateSubscriptionModalContentProps = {
  /** how many seats your org is currently using */
  currentSeats: number;
  /** max seats per tier (e.g. { low: 1, mid: 10, high: 25 }) */
  planLimits: Record<Tier, number>;
};

export function CreateSubscriptionModalContent({
  currentSeats,
  planLimits,
}: CreateSubscriptionModalContentProps) {
  const { t } = useTranslation('billing', { keyPrefix: 'pricing' });
  const { t: tModal } = useTranslation('billing', {
    keyPrefix: 'no-current-plan-modal',
  });
  const [billingPeriod, setBillingPeriod] = useState('annual');

  const navigation = useNavigation();
  const isSubmitting =
    navigation.formData?.get('intent') === OPEN_CHECKOUT_SESSION_INTENT;
  const isSubscribingToLowMonthlyPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.low.monthly;
  const isSubscribingToMidMonthlyPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.mid.monthly;
  const isSubscribingToHighMonthlyPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.high.monthly;
  const isSubscribingToLowAnnualPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.low.annual;
  const isSubscribingToMidAnnualPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.mid.annual;
  const isSubscribingToHighAnnualPlan =
    navigation.formData?.get('lookupKey') ===
    priceLookupKeysByTierAndInterval.high.annual;

  const getFeatures = (key: string): string[] =>
    t(`plans.${key}.features`, { returnObjects: true }) as string[];

  const getButtonProps = (
    interval: Interval,
    tier: Tier,
  ): Partial<ComponentProps<typeof Button>> => {
    const isSubscribing = {
      'monthly-low': isSubscribingToLowMonthlyPlan,
      'monthly-mid': isSubscribingToMidMonthlyPlan,
      'monthly-high': isSubscribingToHighMonthlyPlan,
      'annual-low': isSubscribingToLowAnnualPlan,
      'annual-mid': isSubscribingToMidAnnualPlan,
      'annual-high': isSubscribingToHighAnnualPlan,
    }[`${interval}-${tier}`];

    return {
      children: isSubscribing ? (
        <>
          <Loader2Icon className="animate-spin" />
          {tModal('tier-card-busy')}
        </>
      ) : (
        tModal('tier-card-cta')
      ),
      disabled: isSubscribing || planLimits[tier] < currentSeats,
      name: 'lookupKey',
      value: priceLookupKeysByTierAndInterval[tier][interval],
    };
  };

  // figure out which tiers can’t cover your seats:
  const unavailable = (['low', 'mid', 'high'] as Tier[]).filter(
    tier => planLimits[tier] < currentSeats,
  );

  return (
    <Form method="post" replace>
      {unavailable.length > 0 && (
        <Alert className="mb-4">
          <AlertTitle>{tModal('disabled-plans-alert.title')}</AlertTitle>

          <AlertDescription>
            {unavailable.length === 1
              ? tModal('disabled-plans-alert.description-singular', {
                  currentSeats,
                  planTitle: t(`plans.${unavailable[0]}.title`),
                  planCapacity: planLimits[unavailable[0]],
                })
              : tModal('disabled-plans-alert.description-plural', {
                  currentSeats,
                  plan1Title: t(`plans.${unavailable[0]}.title`),
                  plan1Capacity: planLimits[unavailable[0]],
                  plan2Title: t(`plans.${unavailable[1]}.title`),
                  plan2Capacity: planLimits[unavailable[1]],
                })}
          </AlertDescription>
        </Alert>
      )}

      <fieldset disabled={isSubmitting}>
        <input
          type="hidden"
          name="intent"
          value={OPEN_CHECKOUT_SESSION_INTENT}
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
                      {
                        <Trans
                          i18nKey="billing:pricing.price"
                          values={{ price: '$15' }}
                          components={{
                            1: (
                              <span className="text-muted-foreground text-sm font-normal" />
                            ),
                          }}
                        />
                      }

                      <OfferBadge>-10%</OfferBadge>
                    </TierCardPrice>

                    <TierCardDescription>
                      {t('plans.low.description')}
                    </TierCardDescription>

                    <Button
                      className="w-full"
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
                    <TierCardTitle>{t('plans.enterprise.title')}</TierCardTitle>

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
  );
}
