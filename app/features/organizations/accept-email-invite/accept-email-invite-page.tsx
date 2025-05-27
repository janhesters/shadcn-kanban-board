import type { Organization, UserAccount } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Form, useNavigation } from 'react-router';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

import { ACCEPT_EMAIL_INVITE_INTENT } from './accept-email-invite-constants';

export type AcceptEmailInvitePageProps = {
  inviterName: UserAccount['name'];
  organizationName: Organization['name'];
};

export function AcceptEmailInvitePage({
  inviterName,
  organizationName,
}: AcceptEmailInvitePageProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'accept-email-invite',
  });
  const { t: tCommon } = useTranslation('common');
  const navigation = useNavigation();
  const isAcceptingInvite =
    navigation.formData?.get('intent') === ACCEPT_EMAIL_INVITE_INTENT;

  return (
    <main className="relative isolate px-6 lg:px-8">
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="from-primary to-secondary relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="mb-8 flex justify-center">
          <Badge className="border-border" variant="secondary">
            {t('welcome-to-app-name', { appName: tCommon('app-name') })}
          </Badge>
        </div>

        <div className="text-center">
          <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-6xl">
            {t('invite-you-to-join', { inviterName, organizationName })}
          </h1>

          <p className="text-md text-muted-foreground mt-6 leading-6 text-balance sm:text-lg sm:leading-8">
            {t('accept-invite-instructions')}
          </p>

          <Form
            className="mt-10 flex items-center justify-center gap-x-6"
            method="POST"
          >
            <Button
              disabled={isAcceptingInvite}
              name="intent"
              value={ACCEPT_EMAIL_INVITE_INTENT}
              type="submit"
            >
              {isAcceptingInvite ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  {t('accepting-invite')}
                </>
              ) : (
                t('accept-invite')
              )}
            </Button>
          </Form>
        </div>
      </div>

      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-44rem)]"
        aria-hidden="true"
      >
        <div
          className="from-primary to-secondary relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>
    </main>
  );
}
