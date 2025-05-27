import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { HydratedRouter } from 'react-router/dom';
import { getInitialNamespaces } from 'remix-i18next/client';

import i18n from '~/utils/i18n';

import { onUnhandledRequest } from './test/mocks/msw-utils';

declare global {
  // eslint-disable-next-line no-var
  var __ENABLE_MSW__: boolean | undefined;
}

async function activateMsw() {
  if (globalThis.__ENABLE_MSW__ === true) {
    console.warn('MSW is activated');
    const { worker } = await import('./test/mocks/browser');

    return worker.start({ onUnhandledRequest });
  }

  return;
}

async function hydrate() {
  await activateMsw();

  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(Backend)
    .init({
      ...i18n,
      ns: getInitialNamespaces(),
      backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
      detection: {
        order: ['htmlTag'],
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

if (globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback(() => void hydrate());
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  globalThis.setTimeout(() => void hydrate(), 1);
}
