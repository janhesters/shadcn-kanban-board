import { OrganizationMembershipRole } from '@prisma/client';
import { useTranslation } from 'react-i18next';
import { data, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { Separator } from '~/components/ui/separator';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { DangerZone } from '~/features/organizations/settings/general/danger-zone';
import { GeneralOrganizationSettings } from '~/features/organizations/settings/general/general-organization-settings';
import { generalOrganizationSettingsAction } from '~/features/organizations/settings/general/general-organization-settings-action.server';
import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from '~/features/organizations/settings/general/general-settings-constants';
import { OrganizationInfo } from '~/features/organizations/settings/general/organization-info';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/general';

export const handle = { i18n: ['organizations', 'dropzone'] };

export async function loader({ request, params }: Route.LoaderArgs) {
  const {
    auth: { headers, organization, role },
    t,
  } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    t: i18next.getFixedT(request, ['organizations', 'common']),
  });

  const userIsOwner = role === OrganizationMembershipRole.owner;

  return data(
    {
      organization,
      title: getPageTitle(t, 'settings.general.page-title'),
      userIsOwner,
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await generalOrganizationSettingsAction(args);
}

export default function GeneralOrganizationSettingsRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.general',
  });
  const { userIsOwner, organization } = loaderData;
  const errors = getFormErrors(
    actionData as Awaited<ReturnType<typeof action>>,
  );
  const navigation = useNavigation();
  const isUpdatingOrganization =
    navigation.formData?.get('intent') === UPDATE_ORGANIZATION_INTENT;
  const isDeletingOrganization =
    navigation.formData?.get('intent') === DELETE_ORGANIZATION_INTENT;
  const isSubmitting = isUpdatingOrganization || isDeletingOrganization;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t('page-title')}</h2>

          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>

        <Separator />

        {userIsOwner ? (
          <>
            <GeneralOrganizationSettings
              errors={errors}
              isUpdatingOrganization={isUpdatingOrganization}
              organization={loaderData?.organization}
            />

            <Separator />

            <DangerZone
              isDeletingOrganization={isDeletingOrganization}
              isSubmitting={isSubmitting}
              organizationName={organization.name}
            />
          </>
        ) : (
          <OrganizationInfo
            organizationName={organization.name}
            organizationLogoUrl={organization.imageUrl}
          />
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
