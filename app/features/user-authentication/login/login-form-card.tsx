import { zodResolver } from '@hookform/resolvers/zod';
import type { Organization, UserAccount } from '@prisma/client';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

import { LOGIN_INTENTS } from './login-constants';
import type {
  EmailLoginErrors,
  LoginWithEmailSchema,
  LoginWithGoogleSchema,
} from './login-schemas';
import { loginWithEmailSchema, loginWithGoogleSchema } from './login-schemas';

export type LoginFormCardProps = {
  errors?: EmailLoginErrors;
  inviteLinkInfo?: {
    creatorName: UserAccount['name'];
    organizationName: Organization['name'];
  };
  isLoggingInWithEmail?: boolean;
  isLoggingInWithGoogle?: boolean;
  isSubmitting?: boolean;
};

export function LoginFormCard({
  errors,
  inviteLinkInfo,
  isLoggingInWithEmail = false,
  isLoggingInWithGoogle = false,
  isSubmitting = false,
}: LoginFormCardProps) {
  const { t } = useTranslation('user-authentication');
  const submit = useSubmit();

  /* Email Login Form */

  const emailForm = useForm<LoginWithEmailSchema>({
    resolver: zodResolver(loginWithEmailSchema),
    defaultValues: {
      intent: LOGIN_INTENTS.loginWithEmail,
      email: '',
    },
    errors,
  });

  const handleEmailSubmit = async (values: LoginWithEmailSchema) => {
    await submit(values, { method: 'POST' });
  };

  /* Google Login Form */

  const googleForm = useForm<LoginWithGoogleSchema>({
    resolver: zodResolver(loginWithGoogleSchema),
    defaultValues: { intent: LOGIN_INTENTS.loginWithGoogle },
  });

  const handleGoogleSubmit = async (values: LoginWithGoogleSchema) => {
    await submit(values, { method: 'POST' });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {inviteLinkInfo
            ? t('login.form.join-organization', {
                organizationName: inviteLinkInfo.organizationName,
                creatorName: inviteLinkInfo.creatorName,
                interpolation: { escapeValue: false },
              })
            : t('login.form.card-title')}
        </CardTitle>

        <CardDescription>
          {inviteLinkInfo
            ? t('login.form.join-organization-description', {
                organizationName: inviteLinkInfo.organizationName,
                creatorName: inviteLinkInfo.creatorName,
                interpolation: { escapeValue: false },
              })
            : t('login.form.card-description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6">
          {/* Email Login Form */}
          <FormProvider {...emailForm}>
            <Form
              method="POST"
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
            >
              <fieldset className="grid gap-6" disabled={isSubmitting}>
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.form.email')}</FormLabel>

                      <FormControl>
                        <Input
                          autoComplete="email"
                          placeholder={t('login.form.email-placeholder')}
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
                  value={LOGIN_INTENTS.loginWithEmail}
                  type="submit"
                >
                  {isLoggingInWithEmail ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('login.form.submit-button-loading')}
                    </>
                  ) : (
                    t('login.form.submit-button')
                  )}
                </Button>
              </fieldset>
            </Form>
          </FormProvider>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              {t('login.form.divider-text')}
            </span>
          </div>

          {/* Google Login Form */}
          <FormProvider {...googleForm}>
            <Form
              method="POST"
              onSubmit={googleForm.handleSubmit(handleGoogleSubmit)}
            >
              <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
                <Button
                  className="w-full"
                  name="intent"
                  type="submit"
                  value={LOGIN_INTENTS.loginWithGoogle}
                  variant="outline"
                >
                  {isLoggingInWithGoogle ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('login.form.google')}
                    </>
                  ) : (
                    <>
                      <GooggleIcon />
                      {t('login.form.google')}
                    </>
                  )}
                </Button>
              </fieldset>
            </Form>
          </FormProvider>

          <div className="text-center text-sm">
            {t('login.form.register-prompt')}{' '}
            <Link
              to={href('/register')}
              className={cn(
                buttonVariants({ variant: 'link' }),
                'text-card-foreground hover:text-primary max-h-min p-0 underline underline-offset-4',
              )}
            >
              {t('login.form.register-link')}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
