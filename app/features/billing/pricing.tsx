import type { ComponentProps } from 'react';

import { Badge } from '~/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function TierContainer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('@container/tiers', className)} {...props} />;
}

export function TierGrid({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-8 @xl/tiers:grid-cols-2 @4xl/tiers:grid-cols-3',
        '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs',
        className,
      )}
      {...props}
    />
  );
}

export function TierCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} />;
}

export function TierCardHeader({
  className,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn('gap-3', className)} {...props} />;
}

export function TierCardTitle({
  className,
  ...props
}: ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn('flex items-center justify-between', className)}
      {...props}
    />
  );
}

export function TierCardPrice({
  className,
  ...props
}: ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn(
        'text-foreground flex items-end text-xl font-bold',
        className,
      )}
      {...props}
    />
  );
}

export function OfferBadge({
  className,
  ...props
}: ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn('ml-auto self-center', className)}
      variant="outline"
      {...props}
    />
  );
}

export function TierCardDescription(
  props: ComponentProps<typeof CardDescription>,
) {
  return <CardDescription {...props} />;
}

export function TierCardContent({
  className,
  ...props
}: ComponentProps<typeof CardContent>) {
  return (
    <CardContent className={cn('flex flex-col gap-3', className)} {...props} />
  );
}

export function FeaturesListTitle({
  className,
  ...props
}: ComponentProps<'p'>) {
  return <p className={cn('text-muted-foreground', className)} {...props} />;
}

export function FeaturesList({ className, ...props }: ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function FeatureListItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      className={cn(
        "flex items-center [&_svg:not([class*='mr-'])]:mr-2 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
