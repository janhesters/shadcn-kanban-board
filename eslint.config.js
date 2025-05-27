import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  eslintPluginUnicorn.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports', // Enforces `import type` for type-only imports
          fixStyle: 'separate-type-imports', // Autofixes to use separate `import type` statements
          disallowTypeAnnotations: true, // Disallows `import { type }` in type annotations
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            // For your custom DataWithResponseInit type
            {
              from: 'file',
              name: 'DataWithResponseInit',
            },
            {
              from: 'file',
              name: 'ErrorResponse',
            },
            // For the built-in Response type from lib.dom.d.ts
            {
              from: 'lib',
              name: 'Response',
            },
          ],
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unicorn/better-regex': 'warn',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          replacements: {
            args: false,
            params: false,
            props: false,
            utils: false,
          },
        },
      ],
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: [
            /.*\._index\.(tsx|ts)$/, // Files ending with ._index.tsx
            /.*\$[A-Za-z]+Slug(\.[A-Za-z]+)*\.(tsx,ts)$/, // Files with $SomethingSlug.tsx (e.g., $organizationSlug)
            /.*_\.[A-Za-z]+\.(tsx|ts)$/, // Files with _.something.tsx (e.g., projects_.active.tsx)
          ],
        },
      ],
    },
  },
  {
    files: ['app/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules, 'unicorn/no-null': 'off' },
    settings: { vitest: { typecheck: true } },
    languageOptions: { globals: { ...vitest.environments.env.globals } },
  },
  {
    files: ['src/**/*.test.{jsx,tsx}'],
    ...testingLibrary.configs['flat/react'],
  },
  {
    files: ['playwright/**/*.e2e.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      'playwright/require-top-level-describe': 'error',
      'playwright/no-conditional-expect': 'off',
      'unicorn/prevent-abbreviations': ['error', { checkFilenames: false }],
    },
  },
  eslintPluginPrettierRecommended,
);
