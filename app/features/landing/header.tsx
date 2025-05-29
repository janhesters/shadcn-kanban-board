import { SquareKanbanIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { FaGithub } from 'react-icons/fa6';
import { Link, NavLink } from 'react-router';

import { Button, buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function Header({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-50 w-full border-b backdrop-blur-md',
        className,
      )}
      {...props}
    >
      <div className="container mx-auto flex h-(--header-height) items-center justify-between gap-2 px-4">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          to="/"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md sm:size-6">
            <SquareKanbanIcon className="size-6 sm:size-4" />
          </div>

          <span className="hidden font-mono sm:block">Shadcn Kanban Board</span>
        </Link>

        <nav className="flex gap-2 sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <NavLink
            className={({ isActive }) =>
              cn(
                buttonVariants({ size: 'sm', variant: 'ghost' }),
                isActive && 'bg-accent text-primary',
              )
            }
            to="/example"
          >
            Example
          </NavLink>
        </nav>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <a href="https://github.com/janhesters/shadcn-kanban-board">
              <FaGithub />
              Github
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
