/* eslint-disable @typescript-eslint/require-await */
import { describe, expect, test } from 'vitest';

import { asyncPipe } from './async-pipe.server';

const asyncInc = async (x: number) => x + 1;
const asyncDouble = async (x: number) => x * 2;
const asyncToString = async (x: number) => x.toString();
const asyncShout = async (x: string) => `${x}!`;

describe('asyncPipe()', () => {
  test('given: two promise returning functions, should: compose them in reverse mathematical order', async () => {
    const asyncDoubleInc = asyncPipe(asyncDouble, asyncInc);

    const actual = await asyncDoubleInc(10);
    const expected = 21;

    expect(actual).toEqual(expected);
  });

  test('given: four promise returning functions with mixed types for arguments and return values, should: compose them in reverse mathematical order', async () => {
    const asyncSquareHalveDoubleInc = asyncPipe(
      asyncDouble,
      asyncInc,
      asyncToString,
      asyncShout,
    );

    const actual = await asyncSquareHalveDoubleInc(10);
    const expected = '21!';

    expect(actual).toEqual(expected);
  });
});
