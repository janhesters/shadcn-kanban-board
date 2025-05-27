// tests/billing-helpers.test.ts
import { describe, expect, test } from 'vitest';

import type { Interval, Tier } from './billing-constants';
import { priceLookupKeysByTierAndInterval } from './billing-constants';
import { getTierAndIntervalForLookupKey } from './billing-helpers';

describe('getTierAndIntervalForLookupKey()', () => {
  const validCases: [string, Tier, Interval][] = [
    [priceLookupKeysByTierAndInterval.low.monthly, 'low', 'monthly'],
    [priceLookupKeysByTierAndInterval.low.annual, 'low', 'annual'],
    [priceLookupKeysByTierAndInterval.mid.monthly, 'mid', 'monthly'],
    [priceLookupKeysByTierAndInterval.mid.annual, 'mid', 'annual'],
    [priceLookupKeysByTierAndInterval.high.monthly, 'high', 'monthly'],
    [priceLookupKeysByTierAndInterval.high.annual, 'high', 'annual'],
  ];

  test.each(validCases)(
    'given lookupKey="%s", returns { tier: "%s", interval: "%s" }',
    (lookupKey, tier, interval) => {
      const actual = getTierAndIntervalForLookupKey(lookupKey);
      expect(actual).toEqual({ tier, interval });
    },
  );

  test('unknown lookupKey throws an “Invalid lookup key” error', () => {
    expect(() => getTierAndIntervalForLookupKey('not-a-real-key')).toThrow(
      /Invalid lookup key/,
    );
  });
});
