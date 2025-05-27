import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const rootConfig = defineConfig({
  plugins: [
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '.prisma/client/index-browser':
        './node_modules/.prisma/client/index-browser.js',
    },
  },
  server: { port: 3000 },
});

const testConfig = defineConfig({
  test: {
    workspace: [
      {
        ...rootConfig,
        test: { include: ['app/**/*.test.ts'], name: 'unit-tests' },
      },
      {
        ...rootConfig,
        test: {
          environment: 'happy-dom',
          include: ['app/**/*.test.tsx'],
          name: 'react-happy-dom-tests',
          setupFiles: ['app/test/setup-browser-test-environment.ts'],
        },
      },
    ],
  },
});

export default defineConfig({ ...rootConfig, ...testConfig });
