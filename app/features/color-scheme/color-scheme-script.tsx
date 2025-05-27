import { useLayoutEffect, useMemo } from 'react';

import { useColorScheme } from './use-color-scheme';

export function ColorSchemeScript() {
  const colorScheme = useColorScheme();

  const script = useMemo(
    () => `const colorScheme = ${JSON.stringify(colorScheme)};
if (colorScheme === 'system') {
  const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
  if (media.matches) {
    document.documentElement.classList.add('dark');
  }
}`,
    [],
  );

  if (typeof document !== 'undefined') {
    useLayoutEffect(() => {
      switch (colorScheme) {
        case 'light': {
          document.documentElement.classList.remove('dark');

          break;
        }

        case 'dark': {
          document.documentElement.classList.add('dark');

          break;
        }

        case 'system': {
          function check(media: MediaQueryList | MediaQueryListEvent) {
            if (media.matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
          check(media);

          media.addEventListener('change', check);
          return () => media.removeEventListener('change', check);
        }

        default: {
          console.error('Impossible color scheme state:', colorScheme);
        }
      }
    }, [colorScheme]);
  }

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
