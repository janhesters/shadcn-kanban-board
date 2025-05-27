import { zodResolver } from '@hookform/resolvers/zod';
import type { Organization, UserAccount } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Form, href, Link, useSubmit } from 'react-router';

import { GooggleIcon } from '~/components/svgs/google-icon';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

import { registerIntents } from './registration-constants';
import type {
  EmailRegistrationErrors,
  RegisterWithEmailSchema,
  RegisterWithGoogleSchema,
} from './registration-schemas';
import {
  registerWithEmailSchema,
  registerWithGoogleSchema,
} from './registration-schemas';

export type RegistrationFormCardProps = {
  errors?: EmailRegistrationErrors;
  inviteLinkInfo?: {
    creatorName: UserAccount['name'];
    organizationName: Organization['name'];
  };
  isRegisteringWithEmail?: boolean;
  isRegisteringWithGoogle?: boolean;
  isSubmitting?: boolean;
};

export function RegistrationFormCard({
  errors,
  inviteLinkInfo,
  isRegisteringWithEmail = false,
  isRegisteringWithGoogle = false,
  isSubmitting = false,
}: RegistrationFormCardProps) {
  const { t } = useTranslation('user-authentication');
  const submit = useSubmit();

  /* Email Registration Form */

  const emailForm = useForm<RegisterWithEmailSchema>({
    resolver: zodResolver(registerWithEmailSchema),
    defaultValues: {
      intent: registerIntents.registerWithEmail,
      email: '',
    },
    errors,
  });

  const handleEmailSubmit = async (values: RegisterWithEmailSchema) => {
    await submit(values, { method: 'POST' });
  };

  /* Google Registration Form */

  const googleForm = useForm<RegisterWithGoogleSchema>({
    resolver: zodResolver(registerWithGoogleSchema),
    defaultValues: { intent: registerIntents.registerWithGoogle },
  });

  const handleGoogleSubmit = async (values: RegisterWithGoogleSchema) => {
    await submit(values, { method: 'POST' });
  };

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {inviteLinkInfo ? (
              <span>
                {t('register.form.join-organization', {
                  organizationName: inviteLinkInfo.organizationName,
                  interpolation: { escapeValue: false },
                })}
              </span>
            ) : (
              t('register.form.card-title')
            )}
          </CardTitle>

          <CardDescription>
            {inviteLinkInfo
              ? t('register.form.join-organization-description', {
                  organizationName: inviteLinkInfo.organizationName,
                  creatorName: inviteLinkInfo.creatorName,
                  interpolation: { escapeValue: false },
                })
              : t('register.form.card-description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {/* Email Registration Form */}
            <FormProvider {...emailForm}>
              <Form
                method="POST"
                replace
                onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              >
                <fieldset className="grid gap-6" disabled={isSubmitting}>
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('register.form.email')}</FormLabel>

                        <FormControl>
                          <Input
                            autoComplete="email"
                            placeholder={t('register.form.email-placeholder')}
                            required
                            type="email"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    className="w-full"
                    name="intent"
                    value={registerIntents.registerWithEmail}
                    type="submit"
                  >
                    {isRegisteringWithEmail ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        {t('register.form.submit-button-loading')}
                      </>
                    ) : (
                      t('register.form.submit-button')
                    )}
                  </Button>
                </fieldset>
              </Form>
            </FormProvider>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                {t('register.form.divider-text')}
              </span>
            </div>

            {/* Google Registration Form */}
            <FormProvider {...googleForm}>
              <Form
                method="POST"
                onSubmit={googleForm.handleSubmit(handleGoogleSubmit)}
              >
                <fieldset
                  className="flex flex-col gap-4"
                  disabled={isSubmitting}
                >
                  <Button
                    className="w-full"
                    name="intent"
                    type="submit"
                    value={registerIntents.registerWithGoogle}
                    variant="outline"
                  >
                    {isRegisteringWithGoogle ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        {t('register.form.google')}
                      </>
                    ) : (
                      <>
                        <GooggleIcon />
                        {t('register.form.google')}
                      </>
                    )}
                  </Button>
                </fieldset>
              </Form>
            </FormProvider>

            <div className="text-center text-sm">
              {t('register.form.login-prompt')}{' '}
              <Link
                to={href('/login')}
                className={cn(
                  buttonVariants({ variant: 'link' }),
                  'text-card-foreground hover:text-primary max-h-min p-0 underline underline-offset-4',
                )}
              >
                {t('register.form.login-link')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        <Trans
          components={{
            1: <Link to={href('/terms-of-service')} />,
            2: <Link to={href('/privacy-policy')} />,
          }}
          i18nKey="user-authentication:register.form.terms-and-privacy"
        />
      </div>
    </>
  );
}
