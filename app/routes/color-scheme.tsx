import { colorSchemeAction } from '~/features/color-scheme/color-scheme.server';

import type { Route } from './+types/color-scheme';

export async function action(args: Route.ActionArgs) {
  return await colorSchemeAction(args);
}
