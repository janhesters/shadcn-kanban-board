import { GalleryVerticalEndIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { href, Link, Outlet } from 'react-router';

export default function UserAuthenticationLayout() {
  const { t } = useTranslation();

  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          to={href('/')}
        >
          <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          {t('common:app-name')}
        </Link>

        <Outlet />
      </div>
    </main>
  );
}
