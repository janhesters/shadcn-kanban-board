import { useNavigation, useRouteLoaderData } from 'react-router';

import type { loader as rootLoader } from '~/root';

import type { ColorScheme } from './color-scheme-constants';
import { COLOR_SCHEME_FORM_KEY } from './color-scheme-constants';

export function useColorScheme(): ColorScheme {
  const rootLoaderData = useRouteLoaderData<typeof rootLoader>('root');

  if (!rootLoaderData) {
    throw new Error('Root loader data not found');
  }

  const { formData } = useNavigation();
  const optimisticColorScheme = formData?.get(
    COLOR_SCHEME_FORM_KEY,
  ) as ColorScheme | null;

  return optimisticColorScheme ?? rootLoaderData.colorScheme;
}
