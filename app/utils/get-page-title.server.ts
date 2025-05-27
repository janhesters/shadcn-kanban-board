import type { TFunction } from 'i18next';

export function getPageTitle(t: TFunction, tKey: string) {
  return `${t(tKey)} | ${t('app-name')}`;
}
