import type { ComponentProps } from 'react';

import { cn } from '~/lib/utils';

export function BentoGrid({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('grid gap-4 lg:grid-cols-3 lg:grid-rows-2', className)}
      {...props}
    />
  );
}

export function BentoCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-border rounded-lg border shadow-sm', className)}
      {...props}
    />
  );
}

export function BentoCardHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-2 p-10', className)} {...props} />
  );
}

export function BentoCardEyeBrow({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-primary text-sm font-semibold', className)}
      {...props}
    />
  );
}

export function BentoCardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn('text-foreground text-lg font-medium', className)}
      {...props}
    />
  );
}

export function BentoCardDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-muted-foreground max-w-lg text-sm', className)}
      {...props}
    />
  );
}

export function BentoCardMedia({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('overflow-hidden', className)} {...props} />;
}
