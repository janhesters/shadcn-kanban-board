import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  ssr: true,
  future: {
    unstable_splitRouteModules: 'enforce',
  },
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
