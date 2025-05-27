import copyToClipboard from 'copy-to-clipboard';
import {
  AlertTriangleIcon,
  ClipboardCheckIcon,
  CopyIcon,
  Loader2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, useNavigation } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { inputClassName } from '~/components/ui/input';
import { cn } from '~/lib/utils';

import {
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
} from './team-members-constants';

export type InviteLinkCardProps = {
  inviteLink?: { href: string; expiryDate: string };
  organizationIsFull?: boolean;
};

export function InviteLinkCard({
  inviteLink,
  organizationIsFull = false,
}: InviteLinkCardProps) {
  const { t, i18n } = useTranslation('organizations', {
    keyPrefix: 'settings.team-members.invite-link',
  });

  const [linkCopied, setLinkCopied] = useState(false);

  // Focus management, so that the input's auto focus the link if it changes.
  const mounted = useRef<boolean | null>(null);
  const inviteLinkReference = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (mounted.current && inviteLink?.href) {
      setLinkCopied(false);
      inviteLinkReference.current?.focus();
    }

    // Guard against React 18's ghost remount.
    mounted.current = mounted.current === null ? false : true;
  }, [inviteLink?.href]);

  const navigation = useNavigation();
  const isCreatingNewLink =
    navigation.formData?.get('intent') === CREATE_NEW_INVITE_LINK_INTENT;
  const isDeactivatingLink =
    navigation.formData?.get('intent') === DEACTIVATE_INVITE_LINK_INTENT;
  const isSubmitting = isCreatingNewLink || isDeactivatingLink;

  const formatDate = useCallback(
    (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'full', // e.g., "Wednesday, March 26, 2025"
        timeStyle: 'short', // e.g., "2:30 PM"
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Browser's timezone
      }).format(date);
    },
    [i18n.language],
  );

  const disabled = isSubmitting || organizationIsFull;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('card-title')}</CardTitle>
        <CardDescription>{t('card-description')}</CardDescription>
      </CardHeader>

      {inviteLink ? (
        <>
          <CardContent>
            <div className="relative">
              <a
                aria-describedby="link-expiration-warning"
                aria-label={t('go-to-link')}
                className={cn(
                  inputClassName,
                  'items-center pr-12 read-only:cursor-pointer read-only:opacity-100',
                )}
                href={inviteLink.href}
                ref={inviteLinkReference}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span aria-hidden="true" className="w-full truncate">
                  {inviteLink.href}
                </span>
              </a>

              <Button
                className={cn(
                  'hover:border-input absolute top-0 right-0 rounded-l-none border border-l border-transparent',
                  'border-l-input dark:hover:border-transparent',
                  'dark:hover:border-l-input',
                )}
                onClick={() => {
                  copyToClipboard(inviteLink.href);
                  setLinkCopied(true);
                }}
                variant="ghost"
                size="icon"
              >
                {linkCopied ? (
                  <>
                    <ClipboardCheckIcon />

                    <span className="sr-only">{t('invite-link-copied')}</span>
                  </>
                ) : (
                  <>
                    <CopyIcon />

                    <span className="sr-only">{t('copy-invite-link')}</span>
                  </>
                )}
              </Button>

              <p
                className="text-muted-foreground mt-1 flex text-xs"
                id="link-expiration-warning"
              >
                <span className="grow">
                  {t('link-valid-until', {
                    date: formatDate(inviteLink.expiryDate),
                  })}
                </span>

                <span
                  aria-live="polite"
                  aria-hidden={linkCopied ? 'false' : 'true'}
                  className={cn(
                    'text-primary transform transition duration-300 ease-in-out',
                    linkCopied
                      ? 'translate-x-0 scale-100 opacity-100'
                      : 'translate-x-10 scale-75 opacity-0',
                  )}
                >
                  {t('copied')}
                </span>
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex-col items-stretch">
            <div className="flex items-center gap-2">
              <Form className="grow" method="POST" replace>
                <Button
                  aria-describedby="link-regenerate-warning"
                  className="w-full"
                  disabled={disabled}
                  name="intent"
                  value="createNewInviteLink"
                  type="submit"
                >
                  {isCreatingNewLink ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('regenerating')}
                    </>
                  ) : (
                    <>{t('regenerate-link')}</>
                  )}
                </Button>
              </Form>

              <Form method="POST" replace>
                <Button
                  disabled={isDeactivatingLink}
                  name="intent"
                  value="deactivateInviteLink"
                  type="submit"
                  variant="outline"
                >
                  {isDeactivatingLink ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('deactivating')}
                    </>
                  ) : (
                    <>{t('deactivate-link')}</>
                  )}
                </Button>
              </Form>
            </div>

            <p
              className="text-muted-foreground mt-2 flex items-center text-xs"
              id="link-regenerate-warning"
            >
              <AlertTriangleIcon
                aria-hidden="true"
                className="text-primary mr-1.5 size-4"
              />

              <span>{t('new-link-deactivates-old')}</span>
            </p>
          </CardFooter>
        </>
      ) : (
        <CardFooter>
          <Form className="w-full" method="POST" replace>
            <Button
              className="w-full"
              disabled={disabled}
              name="intent"
              value="createNewInviteLink"
              type="submit"
            >
              {isCreatingNewLink ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  {t('creating')}
                </>
              ) : (
                <>{t('create-new-invite-link')}</>
              )}
            </Button>
          </Form>
        </CardFooter>
      )}
    </Card>
  );
}
