import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { href, Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
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
} from '~/features/billing/pricing';
import { Footer } from '~/features/landing/footer';
import { Header } from '~/features/landing/header';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/pricing';

export const handle = { i18n: 'billing' };

export async function loader({ request }: Route.LoaderArgs) {
  const t = await i18next.getFixedT(request, 'billing');
  return { title: t('pricing-page.page-title') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export default function PricingRoute() {
  const { t } = useTranslation('billing', { keyPrefix: 'pricing' });
  const { t: tPage } = useTranslation('billing', { keyPrefix: 'pricing-page' });
  const [billingPeriod, setBillingPeriod] = useState('annual');

  const getFeatures = (key: string): string[] => {
    return t(`plans.${key}.features`, { returnObjects: true }) as string[];
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-48">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-primary">{tPage('page-title')}</h1>

          <h2 className="mt-2 text-4xl font-bold sm:text-5xl">
            {tPage('pricing-heading')}
          </h2>

          <p className="text-muted-foreground mt-6 text-lg text-pretty">
            {tPage('page-description')}
          </p>
        </div>

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
                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t('plans.low.title')}</TierCardTitle>

                    <TierCardPrice>{t('free')}</TierCardPrice>

                    <TierCardDescription>
                      {t('plans.low.description')}
                    </TierCardDescription>

                    <Button asChild className="w-full">
                      <Link to={href('/register')}>{t('plans.low.cta')}</Link>
                    </Button>
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

                    <Button className="w-full">{t('plans.mid.cta')}</Button>
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

                <TierCard className="ring-primary ring-2">
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

                    <Button className="w-full">{t('plans.high.cta')}</Button>
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
                <TierCard>
                  <TierCardHeader>
                    <TierCardTitle>{t('plans.low.title')}</TierCardTitle>

                    <TierCardPrice>{t('free')}</TierCardPrice>

                    <TierCardDescription>
                      {t('plans.low.description')}
                    </TierCardDescription>

                    <Button asChild className="w-full">
                      <Link to={href('/register')}>{t('plans.low.cta')}</Link>
                    </Button>
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

                    <Button className="w-full">{t('plans.mid.cta')}</Button>
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

                    <Button className="w-full">{t('plans.high.cta')}</Button>
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
      </main>
      <Footer />
    </>
  );
}
