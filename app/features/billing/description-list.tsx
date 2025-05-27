import type { ComponentProps } from 'react';

import { cn } from '~/lib/utils';

export function DescriptionList({ className, ...props }: ComponentProps<'dl'>) {
  return (
    <dl className={cn('divide-border grid gap-3', className)} {...props} />
  );
}

export function DescriptionListRow({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex gap-2 px-4 @xl/form:px-6', className)}
      {...props}
    />
  );
}

export function DescriptionTerm({ className, ...props }: ComponentProps<'dt'>) {
  return <dt className={cn('text-sm font-medium', className)} {...props} />;
}

export function DescriptionDetail({
  className,
  ...props
}: ComponentProps<'dd'>) {
  return <dd className={cn('text-sm font-normal', className)} {...props} />;
}
