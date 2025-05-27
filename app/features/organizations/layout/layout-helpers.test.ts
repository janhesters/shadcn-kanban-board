import type { UIMatch } from 'react-router';
import { describe, expect, test } from 'vitest';

import { findHeaderTitle } from './layout-helpers';

describe('findHeaderTitle()', () => {
  test('given an array of matches: returns the last item in the array that has a header title', () => {
    const matches: UIMatch<
      { headerTitle?: string } & Record<string, unknown>
    >[] = [
      {
        id: 'root',
        pathname: '/',
        params: { organizationSlug: 'tromp---schinner' },
        data: { headerTitle: 'wrong-title' },
        handle: { i18n: 'common' },
      },
      {
        id: 'routes/organization_.$organizationSlug',
        pathname: '/organizations/tromp---schinner',
        params: { organizationSlug: 'tromp---schinner' },
        data: { headerTitle: 'correct-title' },
        handle: { i18n: ['organizations', 'sidebar'] },
      },
      {
        id: 'routes/organization_.$organizationSlug.recordings',
        pathname: '/organizations/tromp---schinner/recordings',
        params: { organizationSlug: 'tromp---schinner' },
        data: { currentPage: 1, organizationName: 'Tromp - Schinner' },
        handle: { i18n: 'recordings' },
      },
    ];

    const actual = findHeaderTitle(matches);
    const expected = 'correct-title';

    expect(actual).toEqual(expected);
  });
});
