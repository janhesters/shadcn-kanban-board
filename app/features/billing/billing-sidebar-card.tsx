import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDate } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';

import type { CreateSubscriptionModalContentProps } from './create-subscription-modal-content';
import { CreateSubscriptionModalContent } from './create-subscription-modal-content';

export type BillingSidebarCardProps = {
  className?: string;
  createSubscriptionModalProps: CreateSubscriptionModalContentProps;
  state: 'trialing' | 'trialEnded' | 'cancelled';
  showButton: boolean;
  trialEndDate: Date;
};

export function BillingSidebarCard({
  className,
  createSubscriptionModalProps,
  state,
  showButton,
  trialEndDate,
}: BillingSidebarCardProps) {
  const { t } = useTranslation('billing', {
    keyPrefix: 'billing-sidebar-card',
  });

  return (
    <Dialog>
      <Card
        className={cn(
          'gap-4 py-4 shadow-none',
          'from-primary/5 to-card bg-gradient-to-t',
          className,
        )}
      >
        <CardHeader
          className={cn(
            'px-4',
            state === 'cancelled' &&
              'text-destructive *:data-[slot=card-description]:text-destructive/90',
          )}
        >
          <CardTitle className="text-sm">
            {state === 'trialing'
              ? t('active-trial.title')
              : state === 'cancelled'
                ? t('subscription-inactive.title')
                : t('trial-ended.title')}
          </CardTitle>

          <CardDescription>
            {state === 'trialing'
              ? t('active-trial.description', {
                  date: formatDate(trialEndDate, 'MMMM dd, yyyy'),
                })
              : state === 'cancelled'
                ? t('subscription-inactive.description')
                : t('trial-ended.description', {
                    date: formatDate(trialEndDate, 'MMMM dd, yyyy'),
                  })}
          </CardDescription>
        </CardHeader>

        {showButton && (
          <CardContent className="px-4">
            <DialogTrigger asChild>
              <Button
                className="w-full shadow-none"
                variant="outline"
                size="sm"
                type="button"
              >
                {state === 'trialing'
                  ? t('active-trial.button')
                  : state === 'cancelled'
                    ? t('subscription-inactive.button')
                    : t('trial-ended.button')}
              </Button>
            </DialogTrigger>
          </CardContent>
        )}
      </Card>

      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-[77rem]">
        <DialogHeader>
          <DialogTitle>
            {state === 'cancelled'
              ? t('subscription-inactive.modal.title')
              : t('billing-modal.title')}
          </DialogTitle>

          <VisuallyHidden>
            <DialogDescription>
              {t('billing-modal.description')}
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <CreateSubscriptionModalContent {...createSubscriptionModalProps} />
      </DialogContent>
    </Dialog>
  );
}
