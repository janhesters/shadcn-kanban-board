import { useTranslation } from 'react-i18next';
import { data, href, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { requireUserNeedsOnboarding } from '~/features/onboarding/onboarding-helpers.server';
import { OnboardingSteps } from '~/features/onboarding/onboarding-steps';
import { onboardingOrganizationAction } from '~/features/onboarding/organization/onboarding-organization-action.server';
import { ONBOARDING_ORGANIZATION_INTENT } from '~/features/onboarding/organization/onboarding-organization-consants';
import { OnboardingOrganizationFormCard } from '~/features/onboarding/organization/onboarding-organization-form-card';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/organization';

export const handle = { i18n: ['onboarding', 'dropzone'] };

export async function loader({ request }: Route.LoaderArgs) {
  const { t, auth } = await promiseHash({
    auth: requireUserNeedsOnboarding(request),
    t: i18next.getFixedT(request, ['onboarding', 'common']),
  });

  return data(
    { title: getPageTitle(t, 'organization.title') },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await onboardingOrganizationAction(args);
}

export default function OrganizationOnboardingRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation('onboarding');
  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get('intent') === ONBOARDING_ORGANIZATION_INTENT;
  const errors = getFormErrors(actionData);

  return (
    <>
      <header className="sr-only">
        <h1>{t('common.onboarding')}</h1>
      </header>

      <main className="mx-auto flex min-h-svh max-w-7xl flex-col space-y-4 py-4 sm:px-6 md:h-full md:space-y-0 md:px-8">
        <OnboardingSteps
          className="px-4 sm:px-0"
          label={t('common.onboarding-progress')}
          steps={[
            {
              name: t('user-account.title'),
              href: href('/onboarding/user-account'),
              status: 'complete',
            },
            {
              name: t('organization.title'),
              href: href('/onboarding/organization'),
              status: 'current',
            },
          ]}
        />

        <div className="flex flex-grow flex-col items-center justify-center py-4">
          <OnboardingOrganizationFormCard
            errors={errors}
            isCreatingOrganization={isCreatingOrganization}
          />
        </div>
      </main>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
