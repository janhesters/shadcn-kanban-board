import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Custom plugin to handle .sudo files
const sudoFilesPlugin = {
  name: 'sudo-files',
  transform(code: string, id: string) {
    if (id.endsWith('.sudo')) {
      return {
        code: `export default ${JSON.stringify(code)}`,
        map: undefined,
      };
    }
  },
};

const rootConfig = defineConfig({
  plugins: [
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    tsconfigPaths(),
    sudoFilesPlugin,
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
          include: ['app/**/*.spec.ts'],
          name: 'integration-tests',
          globalSetup: 'app/test/vitest.global-setup.ts',
          setupFiles: ['app/test/setup-server-test-environment.ts'],
        },
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
