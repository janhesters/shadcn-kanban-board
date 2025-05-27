import { redirect } from 'react-router';

import { logout } from '~/features/user-authentication/user-authentication-helpers.server';

import type { Route } from './+types/logout';

export function loader() {
  return redirect('/');
}

export async function action({ request }: Route.ActionArgs) {
  return await logout(request);
}
