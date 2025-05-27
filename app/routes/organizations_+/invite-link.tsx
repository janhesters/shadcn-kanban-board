import { promiseHash } from 'remix-utils/promise';

import { acceptInviteLinkAction } from '~/features/organizations/accept-invite-link/accept-invite-link-action.server';
import {
  getInviteLinkToken,
  requireCreatorAndOrganizationByTokenExists,
} from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { AcceptInviteLinkPage } from '~/features/organizations/accept-invite-link/accept-invite-link-page';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/invite-link';

export const handle = { i18n: 'organizations' };

export async function loader({ request }: Route.LoaderArgs) {
  const token = getInviteLinkToken(request);
  const { data, t } = await promiseHash({
    data: requireCreatorAndOrganizationByTokenExists(token),
    t: i18next.getFixedT(request, ['common', 'organizations']),
  });
  return {
    title: getPageTitle(t, 'accept-invite-link.page-title'),
    token,
    ...data,
  };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(actionArguments: Route.ActionArgs) {
  return await acceptInviteLinkAction(actionArguments);
}

export default function OrganizationInviteRoute({
  loaderData,
}: Route.ComponentProps) {
  return <AcceptInviteLinkPage {...loaderData} />;
}
