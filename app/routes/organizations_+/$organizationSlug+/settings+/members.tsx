import { useTranslation } from 'react-i18next';
import { data, href, Link, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { EmailInviteCard } from '~/features/organizations/settings/team-members/invite-by-email-card';
import { InviteLinkCard } from '~/features/organizations/settings/team-members/invite-link-card';
import { teamMembersAction } from '~/features/organizations/settings/team-members/team-members-action.server';
import { INVITE_BY_EMAIL_INTENT } from '~/features/organizations/settings/team-members/team-members-constants';
import {
  mapOrganizationDataToTeamMemberSettingsProps,
  requireOrganizationWithMembersAndLatestInviteLinkExistsBySlug,
} from '~/features/organizations/settings/team-members/team-members-helpers.server';
import { TeamMembersTable } from '~/features/organizations/settings/team-members/team-members-table';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/members';

export const handle = { i18n: 'organizations' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { auth, organization, t } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    organization: requireOrganizationWithMembersAndLatestInviteLinkExistsBySlug(
      params.organizationSlug,
    ),
    t: i18next.getFixedT(request, ['organizations', 'common']),
  });

  return data(
    {
      title: getPageTitle(t, 'settings.team-members.page-title'),
      ...mapOrganizationDataToTeamMemberSettingsProps({
        currentUsersId: auth.user.id,
        currentUsersRole: auth.role,
        organization,
        request,
      }),
    },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await teamMembersAction(args);
}

export default function OrganizationMembersRoute({
  actionData,
  loaderData,
  params,
}: Route.ComponentProps) {
  const { t } = useTranslation('organizations', {
    keyPrefix: 'settings.team-members',
  });
  const {
    emailInviteCard,
    inviteLinkCard,
    organizationIsFull,
    teamMemberTable,
  } = loaderData;
  const errors = getFormErrors(actionData);

  const navigation = useNavigation();
  const isInvitingByEmail =
    navigation.formData?.get('intent') === INVITE_BY_EMAIL_INTENT;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="@container/main mx-auto flex w-full max-w-5xl flex-col gap-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t('page-title')}</h2>

          <p className="text-muted-foreground text-sm">
            {teamMemberTable.currentUsersRole === 'member'
              ? t('description-member')
              : t('description')}
          </p>
        </div>

        <Separator />

        {organizationIsFull && (
          <div className="@container/alert">
            <Alert
              className="flex flex-col gap-2 @2xl/alert:block"
              variant="destructive"
            >
              <AlertTitle>{t('organization-is-full-alert.title')}</AlertTitle>

              <AlertDescription>
                {t('organization-is-full-alert.description')}
              </AlertDescription>

              <Button
                asChild
                className="shadow-none @2xl/alert:absolute @2xl/alert:top-1/2 @2xl/alert:right-3 @2xl/alert:-translate-y-1/2"
                size="sm"
              >
                <Link
                  to={href(
                    '/organizations/:organizationSlug/settings/billing',
                    { organizationSlug: params.organizationSlug },
                  )}
                >
                  {t('organization-is-full-alert.button')}
                </Link>
              </Button>
            </Alert>
          </div>
        )}

        {teamMemberTable.currentUsersRole !== 'member' && (
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 items-start gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @3xl/main:grid-cols-2">
            <EmailInviteCard
              {...emailInviteCard}
              errors={errors}
              isInvitingByEmail={isInvitingByEmail}
              successEmail={
                (actionData as unknown as { success?: string })?.success
              }
            />

            <InviteLinkCard {...inviteLinkCard} />
          </div>
        )}

        <TeamMembersTable {...teamMemberTable} />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
