import type { Organization } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Form } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { cn } from '~/lib/utils';

export const DELETE_USER_ACCOUNT_INTENT = 'delete-user-account';

export type DangerZoneProps = {
  imlicitlyDeletedOrganizations: Organization['name'][];
  isDeletingAccount?: boolean;
  organizationsBlockingAccountDeletion: Organization['name'][];
};

function Strong({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('text-foreground font-semibold', className)}>
      {children}
    </span>
  );
}

export function DangerZone({
  imlicitlyDeletedOrganizations,
  isDeletingAccount = false,
  organizationsBlockingAccountDeletion,
}: DangerZoneProps) {
  const { t } = useTranslation('settings', {
    keyPrefix: 'user-account.danger-zone',
  });

  const isDeleteBlocked = organizationsBlockingAccountDeletion.length > 0;
  const hasImplicitDeletions = imlicitlyDeletedOrganizations.length > 0;

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="text-destructive leading-none font-semibold">
        {t('title')}
      </h2>

      <div className="border-destructive rounded-xl border px-4 py-2">
        <div className="flex flex-col justify-between gap-y-2 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="text-foreground font-medium">
              {t('delete-title')}
            </div>

            {isDeleteBlocked ? (
              <p className="text-muted-foreground space-y-1 text-sm">
                <Trans
                  components={{ 1: <Strong /> }}
                  count={organizationsBlockingAccountDeletion.length}
                  i18nKey="settings:user-account.danger-zone.blocking-organizations"
                  values={{
                    organizations:
                      organizationsBlockingAccountDeletion.join(', '),
                  }}
                  shouldUnescape
                />{' '}
                <span>{t('blocking-organizations-help')}</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t('delete-description')}
              </p>
            )}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={isDeleteBlocked} variant="destructive">
                {t('delete-button')}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialog-title')}</DialogTitle>
                <div className="space-y-2">
                  <DialogDescription>
                    {t('dialog-description')}
                  </DialogDescription>

                  {hasImplicitDeletions && (
                    <div className="text-muted-foreground text-sm">
                      <Trans
                        components={{ 1: <Strong /> }}
                        count={imlicitlyDeletedOrganizations.length}
                        i18nKey="settings:user-account.danger-zone.implicitly-deleted-organizations"
                        shouldUnescape
                        values={{
                          organizations:
                            imlicitlyDeletedOrganizations.join(', '),
                        }}
                      />
                    </div>
                  )}
                </div>
              </DialogHeader>

              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button
                    className="mt-2 sm:mt-0"
                    disabled={isDeletingAccount}
                    type="button"
                    variant="secondary"
                  >
                    {t('cancel')}
                  </Button>
                </DialogClose>

                <Form method="POST" replace>
                  <Button
                    disabled={isDeletingAccount}
                    name="intent"
                    type="submit"
                    value={DELETE_USER_ACCOUNT_INTENT}
                    variant="destructive"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        {t('deleting')}
                      </>
                    ) : (
                      t('delete-confirm')
                    )}
                  </Button>
                </Form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
