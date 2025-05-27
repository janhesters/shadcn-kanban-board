import { redirect } from 'react-router';

import type { Route } from './+types/_index';

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url).pathname;
  return redirect(url + '/user-account');
}
