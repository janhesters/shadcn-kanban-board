import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { Iphone15Pro } from '~/components/magicui/iphone-15-pro';
import { cn } from '~/lib/utils';

import {
  BentoCard,
  BentoCardDescription,
  BentoCardEyeBrow,
  BentoCardHeader,
  BentoCardMedia,
  BentoCardTitle,
  BentoGrid,
} from './bento-grid';

const imageClassNames = 'w-full rounded-t-lg h-full object-cover object-left';
const imageFadeStyle: CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent)',
  maskImage: 'linear-gradient(to bottom, black 75%, transparent)',
};

type BentoCardTranslations = {
  eyebrow?: string;
  title: string;
  description: string;
  image?: {
    light: string;
    dark: string;
  };
};

export function Features() {
  const { t } = useTranslation('landing', { keyPrefix: 'features' });
  const cards = t('cards', { returnObjects: true }) as BentoCardTranslations[];

  return (
    <section className="px-4 py-24">
      <h2 className="text-primary text-base font-semibold">{t('eyebrow')}</h2>

      <p className="text-foreground mt-2 max-w-lg text-4xl font-semibold text-pretty sm:text-5xl">
        {t('title')}
      </p>

      <BentoGrid className="mt-10 max-lg:[&_>*:first-child]:rounded-t-4xl max-lg:[&_>*:last-child]:rounded-b-4xl">
        {/* Responsiveness Card */}
        <BentoCard className="flex flex-col lg:row-span-2 lg:rounded-tl-4xl">
          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[0].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[0].title}</BentoCardTitle>
            <BentoCardDescription>{cards[0].description}</BentoCardDescription>
          </BentoCardHeader>

          <div className="relative flex h-full flex-col items-center px-10 max-lg:min-h-120">
            <BentoCardMedia className="absolute top-0 bottom-0">
              <Iphone15Pro
                className="dark:hidden"
                src="/images/app-mobile-light.png"
              />

              <Iphone15Pro
                className="hidden dark:block"
                src="/images/app-mobile-dark.png"
              />
            </BentoCardMedia>
          </div>
        </BentoCard>

        {/* Billing Card */}
        <BentoCard className="max-h-min lg:col-span-2 lg:row-span-2 lg:rounded-tr-4xl">
          <BentoCardMedia className="overflow-hidden">
            <img
              alt={cards[1].image?.light}
              className={cn(
                imageClassNames,
                'lg:rounded-tr-4xl',
                'dark:hidden',
              )}
              src="/images/app-billing-light.png"
              style={imageFadeStyle}
            />
            <img
              alt={cards[1].image?.dark}
              className={cn(
                imageClassNames,
                'lg:rounded-tr-4xl',
                'hidden dark:block',
              )}
              src="/images/app-billing-dark.png"
              style={imageFadeStyle}
            />
          </BentoCardMedia>

          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[1].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[1].title}</BentoCardTitle>
            <BentoCardDescription>{cards[1].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Authentication Card */}
        <BentoCard className="max-h-min lg:col-span-2 lg:row-span-2">
          <BentoCardMedia className="h-64 lg:h-88">
            <img
              alt={cards[2].image?.light}
              className={cn(imageClassNames, 'object-center', 'dark:hidden')}
              src="/images/authentication-light.png"
              style={imageFadeStyle}
            />
            <img
              alt={cards[2].image?.dark}
              className={cn(
                imageClassNames,
                'object-center',
                'hidden dark:block',
              )}
              src="/images/authentication-dark.png"
              style={imageFadeStyle}
            />
          </BentoCardMedia>

          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[2].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[2].title}</BentoCardTitle>
            <BentoCardDescription>{cards[2].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Notifications Card */}
        <BentoCard>
          <BentoCardMedia>
            <img
              alt={cards[3].image?.light}
              className={cn('rounded-t-lg', 'dark:hidden')}
              src="/images/notifications-light.png"
              style={imageFadeStyle}
            />

            <img
              alt={cards[3].image?.dark}
              className={cn('rounded-t-lg', 'hidden dark:block')}
              src="/images/notifications-dark.png"
              style={imageFadeStyle}
            />
          </BentoCardMedia>

          <BentoCardHeader>
            <BentoCardTitle>{cards[3].title}</BentoCardTitle>
            <BentoCardDescription>{cards[3].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Dark Mode Card */}
        <BentoCard>
          <BentoCardHeader>
            <BentoCardTitle>{cards[4].title}</BentoCardTitle>
            <BentoCardDescription>{cards[4].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Member Management Card */}
        <BentoCard className="lg:rounded-bl-4xl">
          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[5].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[5].title}</BentoCardTitle>
            <BentoCardDescription>{cards[5].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Internationalization Card */}
        <BentoCard>
          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[6].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[6].title}</BentoCardTitle>
            <BentoCardDescription>{cards[6].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>

        {/* Miscellaneous Card */}
        <BentoCard className="lg:rounded-br-4xl">
          <BentoCardHeader>
            <BentoCardEyeBrow>{cards[7].eyebrow}</BentoCardEyeBrow>
            <BentoCardTitle>{cards[7].title}</BentoCardTitle>
            <BentoCardDescription>{cards[7].description}</BentoCardDescription>
          </BentoCardHeader>
        </BentoCard>
      </BentoGrid>
    </section>
  );
}
