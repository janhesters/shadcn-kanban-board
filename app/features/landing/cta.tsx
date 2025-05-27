import { BookTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

export function CTA() {
  const { t } = useTranslation('landing', { keyPrefix: 'cta' });

  return (
    <section className="py-12 lg:px-4">
      <div className="bg-foreground dark:bg-background border-border relative isolate mx-auto max-w-7xl overflow-hidden px-6 py-16 shadow-2xl sm:rounded-3xl sm:border sm:px-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-background dark:text-foreground text-4xl font-semibold text-pretty sm:text-5xl">
            {t('title')}
          </h2>

          <p className="text-ring dark:text-muted-foreground mt-4 text-lg text-pretty">
            {t('description')}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild>
            <Link to="/register">{t('buttons.primary')}</Link>
          </Button>

          <Button
            asChild
            className="text-background dark:text-foreground"
            variant="link"
          >
            <a href="https://github.com/janhesters/react-router-saas-template">
              {t('buttons.secondary')}
              <BookTextIcon />
            </a>
          </Button>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        >
          <div
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            }}
            className="from-primary to-primary dark:to-secondary aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r opacity-25"
          />
        </div>
      </div>
    </section>
  );
}
