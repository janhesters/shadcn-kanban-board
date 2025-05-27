import { useTranslation } from 'react-i18next';
import {
  data,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { getInviteInfoForAuthRoutes } from '~/features/organizations/organizations-helpers.server';
import type { RegisterActionData } from '~/features/user-authentication/registration/register-action.server';
import { registerAction } from '~/features/user-authentication/registration/register-action.server';
import { RegistrationFormCard } from '~/features/user-authentication/registration/registration-form-card';
import { RegistrationVerificationAwaiting } from '~/features/user-authentication/registration/registration-verification-awaiting';
import { registerIntents } from '~/features/user-authentication/user-authentication-constants';
import { getIsAwaitingEmailConfirmation } from '~/features/user-authentication/user-authentication-helpers';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/login';

export const handle = { i18n: 'user-authentication' };

export async function loader({ request }: Route.LoaderArgs) {
  const { t, linkData } = await promiseHash({
    userIsAnonymous: requireUserIsAnonymous(request),
    t: i18next.getFixedT(request, ['user-authentication', 'common']),
    linkData: getInviteInfoForAuthRoutes(request),
  });
  return data(
    {
      title: getPageTitle(t, 'register.page-title'),
      inviteLinkInfo: linkData.inviteLinkInfo,
    },
    { headers: linkData.headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return registerAction(args);
}

export default function RegisterRoute() {
  const { t } = useTranslation('user-authentication');
  const navigation = useNavigation();
  const actionData = useActionData<RegisterActionData>();
  const { inviteLinkInfo } = useLoaderData<typeof loader>();

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);
  const errors = getFormErrors(actionData);

  const isRegisteringWithEmail =
    navigation.formData?.get('intent') === registerIntents.registerWithEmail;
  const isRegisteringWithGoogle =
    navigation.formData?.get('intent') === registerIntents.registerWithGoogle;
  const isSubmitting = isRegisteringWithEmail || isRegisteringWithGoogle;

  return (
    <>
      <h1 className="sr-only">{t('register.page-title')}</h1>

      <div className="flex flex-col gap-6">
        {isAwaitingEmailConfirmation ? (
          <RegistrationVerificationAwaiting
            email={actionData?.email}
            isResending={isRegisteringWithEmail}
            isSubmitting={isSubmitting}
          />
        ) : (
          <RegistrationFormCard
            errors={errors}
            inviteLinkInfo={inviteLinkInfo}
            isRegisteringWithEmail={isRegisteringWithEmail}
            isRegisteringWithGoogle={isRegisteringWithGoogle}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
