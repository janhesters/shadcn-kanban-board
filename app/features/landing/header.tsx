import { GalleryVerticalEndIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';

export function Header() {
  const { t } = useTranslation('landing', { keyPrefix: 'header' });
  const { t: tCommon } = useTranslation('common');

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-(--header-height) items-center justify-between gap-2 px-4">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          to="/"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md sm:size-6">
            <GalleryVerticalEndIcon className="size-6 sm:size-4" />
          </div>

          <span className="hidden font-mono sm:block">
            {tCommon('app-name')}
          </span>
        </Link>

        <nav className="flex gap-2 sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/pricing">{t('nav-links.pricing')}</Link>
          </Button>
        </nav>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/login">{t('login')}</Link>
          </Button>

          <Button asChild size="sm">
            <Link to="/login">{t('register')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
