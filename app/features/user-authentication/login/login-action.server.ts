import type { AuthOtpResponse } from '@supabase/supabase-js';
import { redirect } from 'react-router';
import { z } from 'zod';

import { retrieveUserAccountFromDatabaseByEmail } from '~/features/user-accounts/user-accounts-model.server';
import { getErrorMessage } from '~/utils/get-error-message';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { tooManyRequests, unauthorized } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { requireUserIsAnonymous } from '../user-authentication-helpers.server';
import {
  type EmailLoginErrors,
  loginWithEmailSchema,
  loginWithGoogleSchema,
} from './login-schemas';
import type { Route } from '.react-router/types/app/routes/_user-authentication+/+types/login';

export type LoginActionData =
  | (AuthOtpResponse['data'] & { email: string })
  | Response
  | { errors: EmailLoginErrors };

const loginSchema = z.discriminatedUnion('intent', [
  loginWithEmailSchema,
  loginWithGoogleSchema,
]);

export async function loginAction({
  request,
}: Route.ActionArgs): Promise<LoginActionData> {
  try {
    const { supabase, headers } = await requireUserIsAnonymous(request);
    const t = await i18next.getFixedT(request);
    const body = await validateFormData(request, loginSchema);

    switch (body.intent) {
      case 'loginWithEmail': {
        const userAccount = await retrieveUserAccountFromDatabaseByEmail(
          body.email,
        );

        if (!userAccount) {
          throw unauthorized({
            errors: {
              email: {
                message: 'user-authentication:login.form.user-doesnt-exist',
              },
            },
          });
        }

        const { data, error } = await supabase.auth.signInWithOtp({
          email: body.email,
          options: {
            data: { intent: body.intent, appName: t('common:app-name') },
            shouldCreateUser: false,
          },
        });

        if (error) {
          const errorMessage = getErrorMessage(error);

          // Error: For security purposes, you can only request this after 10 seconds.
          if (errorMessage.includes('you can only request this after')) {
            throw tooManyRequests({
              errors: {
                email: {
                  message: 'user-authentication:login.form.login-failed',
                },
              },
            });
          }

          throw new Error(errorMessage);
        }

        return { ...data, email: body.email };
      }
      case 'loginWithGoogle': {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${process.env.APP_URL}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        return redirect(data.url, { headers });
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit<{ errors: EmailLoginErrors }>(error)) {
      // @ts-expect-error - TypeScript doesn't know that React Router will
      // access the properties of the data property of the response.
      return error;
    }

    throw error;
  }
}
