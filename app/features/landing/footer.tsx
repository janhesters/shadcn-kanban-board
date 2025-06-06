import type { ComponentProps } from 'react';
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6';

import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

import { ThemeToggle } from '../color-scheme/theme-toggle';
import { ReactsquadLogoIcon } from './svgs/reactsquad-logo-icon';

export function Footer({ className, ...props }: ComponentProps<'footer'>) {
  return (
    <footer
      className={cn('border-t sm:h-[var(--header-height)]', className)}
      {...props}
    >
      <div className="container mx-auto flex h-full flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <Button
            aria-label="YouTube"
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://www.youtube.com/@janhesters">
              <FaYoutube />
            </a>
          </Button>

          <Button
            aria-label="LinkedIn"
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://www.linkedin.com/in/jan-hesters/">
              <FaLinkedin />
            </a>
          </Button>

          <Button
            aria-label="X (formerly known as Twitter)"
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
            aria-label="Github"
            asChild
            className="size-8"
            size="icon"
            variant="outline"
          >
            <a href="https://github.com/janhesters">
              <FaGithub />
            </a>
          </Button>

          <div className="h-6">
            <Separator orientation="vertical" />
          </div>

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            Made with ❤️ by
            <a
              aria-label="ReactSquad"
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
