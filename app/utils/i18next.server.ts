import path from 'node:path';

import Backend from 'i18next-fs-backend/cjs';
import { RemixI18Next } from 'remix-i18next/server';

import i18n from './i18n';

const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: process.env.VERCEL
        ? path.resolve('build', 'client', './locales/{{lng}}/{{ns}}.json')
        : path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
    },
  },
  plugins: [Backend],
});

export default i18next;
