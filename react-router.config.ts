import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  prerender: true,
  future: {
    unstable_splitRouteModules: 'enforce',
  },
} satisfies Config;
