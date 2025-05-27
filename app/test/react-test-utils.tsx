import path from 'node:path';

import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import i18nConfig from '~/utils/i18n';

type JSONModule = {
  default: Record<string, unknown>;
};

// translations is an object like:
// {
//   '../public/locales/en/common.json': { default: { /*…*/ } },
//   '../public/locales/en/billing.json': { default: { /*…*/ } },
//    …
// }
const translations: Record<string, JSONModule> = import.meta.glob(
  '../../public/locales/en/*.json',
  { eager: true },
);

// build the “resources” shape i18next likes:
const resources = {
  en: Object.fromEntries(
    Object.entries(translations).map(([file, module_]) => {
      const ns = /\/([^/]+)\.json$/.exec(file)![1];
      return [ns, module_.default];
    }),
  ),
};

// Initialize i18next for tests with actual translations.
void i18next
  .use(initReactI18next)
  .use(Backend)
  .init({
    ...i18nConfig,
    lng: 'en',
    resources,
    ns: Object.keys(resources.en),
    // Use the fs backend to load translations from the file system.
    backend: {
      loadPath: path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
    },
    // Disable suspense in tests.
    react: {
      useSuspense: false,
    },
    // Load translations synchronously in tests.
    initImmediate: false,
  });

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
export { createRoutesStub } from 'react-router';
