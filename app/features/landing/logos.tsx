import { useTranslation } from 'react-i18next';
import { FaStripe } from 'react-icons/fa6';
import {
  SiEslint,
  SiMockserviceworker,
  SiPostgresql,
  SiPrettier,
  SiPrisma,
  SiShadcnui,
  SiSupabase,
  SiTailwindcss,
  SiTestinglibrary,
  SiTypescript,
  SiVitest,
} from 'react-icons/si';

import { Marquee } from '~/components/magicui/marquee';

import { PlaywrightIcon } from './svgs/playwright-icon';
import { RRLockupDarkIcon } from './svgs/rr-lockup-dark-icon';
import { RRLockupLightIcon } from './svgs/rr-lockup-light-icon';

export function Logos() {
  const { t } = useTranslation('landing', { keyPrefix: 'logos' });
  return (
    <section className="py-12 text-center sm:px-4">
      <h2 className="text-muted-foreground text-center text-sm font-semibold">
        {t('title')}
      </h2>

      <div className="relative mt-6">
        {/* Marquee with fading edges */}
        <Marquee className="max-w-full">
          {[
            <>
              <RRLockupDarkIcon className="hidden h-24 w-auto dark:block" />
              <RRLockupLightIcon className="block h-24 w-auto dark:hidden" />
            </>,
            <SiTypescript title="TypeScript" key="ts" className="size-16" />,
            <SiSupabase title="Supabase" key="supabase" className="size-16" />,
            <FaStripe title="Stripe" key="stripe" className="size-16" />,
            <SiTailwindcss
              title="Tailwind CSS"
              key="tailwind"
              className="size-16"
            />,
            <SiShadcnui title="shadcn/ui" key="shadcn" className="size-16" />,
            <SiVitest title="Vitest" key="vitest" className="size-16" />,
            <PlaywrightIcon key="playwright" className="size-16" />,
            <SiPostgresql title="PostgreSQL" key="pg" className="size-16" />,
            <SiPrisma title="Prisma" key="prisma" className="size-16" />,
            <SiMockserviceworker
              title="MSW (Mock Service Worker)"
              key="msw"
              className="size-16"
            />,
            <SiTestinglibrary
              title="React Testing Library"
              key="rtl"
              className="size-16"
            />,
            <SiEslint title="ESLint" key="eslint" className="size-16" />,
            <SiPrettier title="Prettier" key="prettier" className="size-16" />,
          ].map((icon, index) => (
            <div
              key={index}
              className="flex size-32 items-center justify-center text-4xl opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
            >
              {icon}
            </div>
          ))}
        </Marquee>

        {/* Fading edges */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r to-transparent" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l to-transparent" />
      </div>
    </section>
  );
}
