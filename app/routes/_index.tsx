import LandingPage from '~/features/landing/landing-page';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';

import type { Route } from './+types/_index';

export const handle = { i18n: ['common', 'landing'] };

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserIsAnonymous(request);
  return {};
}

export default function LandingRoute() {
  return <LandingPage />;
}
