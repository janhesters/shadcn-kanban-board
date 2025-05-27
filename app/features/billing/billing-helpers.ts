// src/billing-helpers.ts
import type { Interval, Tier } from './billing-constants';
import { priceLookupKeysByTierAndInterval } from './billing-constants';

/**
 * Given one of your lookup‐keys (e.g. 'monthly_hobby_plan'),
 * returns its associated tier and interval, or throws if the key is not found.
 *
 * @param lookupKey - The lookup key to look up.
 * @returns An object with `tier` and `interval`.
 * @throws If no entry matches the given `lookupKey`.
 */
export function getTierAndIntervalForLookupKey(lookupKey: string): {
  tier: Tier;
  interval: Interval;
} {
  for (const [tier, intervals] of Object.entries(
    priceLookupKeysByTierAndInterval,
  ) as [Tier, (typeof priceLookupKeysByTierAndInterval)[Tier]][]) {
    for (const [interval, key] of Object.entries(intervals) as [
      Interval,
      string,
    ][]) {
      if (key === lookupKey) {
        return { tier, interval };
      }
    }
  }

  throw new Error(`Invalid lookup key: ${lookupKey}`);
}
