import { useLoaderData } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { acceptEmailInviteAction } from '~/features/organizations/accept-email-invite/accept-email-invite-action.server';
import {
  getEmailInviteToken,
  requireEmailInviteDataByTokenExists,
} from '~/features/organizations/accept-email-invite/accept-email-invite-helpers.server';
import { AcceptEmailInvitePage } from '~/features/organizations/accept-email-invite/accept-email-invite-page';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/email-invite';

export const handle = { i18n: 'organizations' };

export async function loader({ request }: Route.LoaderArgs) {
  const token = getEmailInviteToken(request);
  const { data, t } = await promiseHash({
    data: requireEmailInviteDataByTokenExists(token),
    t: i18next.getFixedT(request, ['common', 'organizations']),
  });

  return {
    title: getPageTitle(t, 'accept-email-invite.page-title'),
    ...data,
  } as const;
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return acceptEmailInviteAction(args);
}

export default function EmailInviteRoute() {
  const { inviterName, organizationName } = useLoaderData<typeof loader>();
  return (
    <AcceptEmailInvitePage
      inviterName={inviterName}
      organizationName={organizationName}
    />
  );
}
