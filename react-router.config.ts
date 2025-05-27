import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    unstable_splitRouteModules: 'enforce',
  },
} satisfies Config;
