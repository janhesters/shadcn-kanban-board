import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export type NotFoundProps = {
  className?: string;
};

export function NotFound({ className }: NotFoundProps) {
  return (
    <main
      className={cn(
        'grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8',
        className,
      )}
    >
      <div className="text-center">
        <p className="text-primary text-base font-semibold">404</p>

        <h1 className="text-foreground mt-4 text-3xl font-bold tracking-tighter sm:text-5xl">
          Page Not Found
        </h1>

        <p className="text-muted-foreground mt-6 text-base">
          Sorry, we couldn't find the page you're looking for.
        </p>

        <Button asChild className="mt-10">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </main>
  );
}
