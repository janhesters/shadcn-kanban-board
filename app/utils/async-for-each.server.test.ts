import { describe, expect, test, vi } from 'vitest';

import { asyncForEach } from './async-for-each.server';

describe('asyncForEach()', () => {
  test('given: an array and a callback, should: call the callback for each item in the array', async () => {
    const array = [1, 2, 3];
    const callback = vi.fn();

    await asyncForEach(array, callback);

    expect(callback).toHaveBeenCalledTimes(3);
  });
});
