import { useTranslation } from 'react-i18next';
import { TbArrowLeft } from 'react-icons/tb';
import { Link, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { Button } from '~/components/ui/button';
import { ThemeToggle } from '~/features/color-scheme/theme-toggle';
import { createOrganizationAction } from '~/features/organizations/create-organization/create-organization-action.server';
import { CREATE_ORGANIZATION_INTENT } from '~/features/organizations/create-organization/create-organization-constants';
import { CreateOrganizationFormCard } from '~/features/organizations/create-organization/create-organization-form-card';
import { requireAuthenticatedUserExists } from '~/features/user-accounts/user-accounts-helpers.server';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/new';

export const handle = { i18n: ['organizations', 'dropzone'] };

export async function loader(args: Route.LoaderArgs) {
  const { t } = await promiseHash({
    userIsAnonymous: requireAuthenticatedUserExists(args.request),
    t: i18next.getFixedT(args.request, ['organizations', 'common']),
  });
  return { title: getPageTitle(t, 'new.page-title') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await createOrganizationAction(args);
}

export default function NewOrganizationRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation('organizations', { keyPrefix: 'new' });

  const errors = getFormErrors(actionData);

  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get('intent') === CREATE_ORGANIZATION_INTENT;

  return (
    <>
      <header className="flex h-[--header-height] items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Button asChild className="size-8" size="icon" variant="outline">
              <Link aria-label={t('back-button-label')} to="/organizations">
                <TbArrowLeft />
              </Link>
            </Button>

            <h1 className="text-base font-medium">{t('page-title')}</h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100svh-var(--header-height))] w-full max-w-lg flex-col items-center justify-center px-4 py-4 md:py-6 lg:px-6">
        <CreateOrganizationFormCard
          errors={errors}
          isCreatingOrganization={isCreatingOrganization}
        />
      </main>
    </>
  );
}
