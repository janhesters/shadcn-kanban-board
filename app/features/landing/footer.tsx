import { useTranslation } from 'react-i18next';
import { FaGithub, FaLinkedin, FaXTwitter } from 'react-icons/fa6';

import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import { ThemeToggle } from '../color-scheme/theme-toggle';
import { ReactsquadLogoIcon } from './svgs/reactsquad-logo-icon';

export function Footer() {
  const { t } = useTranslation('landing', { keyPrefix: 'footer' });

  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row md:h-(--header-height) md:py-0">
        <div className="flex items-center gap-2">
          <Button
            aria-label={t('social.github')}
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://github.com/janhesters/react-router-saas-template">
              <FaGithub />
            </a>
          </Button>

          <Button
            aria-label={t('social.twitter')}
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://x.com/janhesters">
              <FaXTwitter />
            </a>
          </Button>

          <Button
            aria-label={t('social.linkedin')}
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://www.linkedin.com/in/jan-hesters/">
              <FaLinkedin />
            </a>
          </Button>

          <div className="h-6">
            <Separator orientation="vertical" />
          </div>

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            {t('made-with-love')}
            <a
              aria-label={t('reactsquad')}
              className="text-foreground h-6 w-auto"
              href="https://reactsquad.io"
            >
              <ReactsquadLogoIcon />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
