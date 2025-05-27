import type { TFunction } from 'i18next';
import { describe, expect, test } from 'vitest';

import { getPageTitle } from './get-page-title.server';

const createMockT = (pageTitle: string): TFunction => {
  const mockT = ((key: string) => {
    switch (key) {
      case pageTitle: {
        return pageTitle.split('.')[0];
      }
      case 'app-name': {
        return 'React Router SaaS Template';
      }
      default: {
        return key;
      }
    }
  }) as TFunction;

  return mockT;
};

describe('getPageTitle', () => {
  test('given: a translation key, should: return the translated title combined with the app name', () => {
    const mockT = createMockT('login.page-title');

    const actual = getPageTitle(mockT, 'login.page-title');
    const expected = 'login | React Router SaaS Template';

    expect(actual).toEqual(expected);
  });

  test('given: a different translation key, should: return the translated title combined with the app name', () => {
    const mockT = createMockT('register.page-title');

    const actual = getPageTitle(mockT, 'register.page-title');
    const expected = 'register | React Router SaaS Template';

    expect(actual).toEqual(expected);
  });
});
