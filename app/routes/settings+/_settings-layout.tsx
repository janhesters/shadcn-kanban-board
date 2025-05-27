import { useTranslation } from 'react-i18next';
import { TbArrowLeft } from 'react-icons/tb';
import { Link, Outlet } from 'react-router';

import { Button } from '~/components/ui/button';
import { ThemeToggle } from '~/features/color-scheme/theme-toggle';

export const handle = { i18n: 'settings' };

export default function SettingsLayout() {
  const { t } = useTranslation('settings', { keyPrefix: 'layout' });

  return (
    <>
      <header className="flex h-(--header-height) items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Button asChild className="size-8" size="icon" variant="outline">
              <Link aria-label={t('back-button-label')} to="/organizations">
                <TbArrowLeft />
              </Link>
            </Button>

            <h1 className="text-base font-medium">{t('page-title')}</h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}
