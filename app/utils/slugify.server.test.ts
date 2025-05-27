import { describe, expect, test } from 'vitest';

import { slugify } from './slugify.server';

describe('slugify', () => {
  test('given: undefined input, should: return empty string', () => {
    const actual = slugify();
    const expected = '';

    expect(actual).toEqual(expected);
  });

  test('given: empty string, should: return empty string', () => {
    const actual = slugify('');
    const expected = '';

    expect(actual).toEqual(expected);
  });

  test('given: a string, should: return a slug', () => {
    const actual = slugify('new');
    const expected = 'new';

    expect(actual).toEqual(expected);
  });

  test('given: string with spaces, should: replace spaces with hyphens', () => {
    const actual = slugify('hello world example');
    const expected = 'hello-world-example';

    expect(actual).toEqual(expected);
  });

  test('given: string with uppercase letters, should: convert to lowercase', () => {
    const actual = slugify('HELLO World');
    const expected = 'hello-world';

    expect(actual).toEqual(expected);
  });

  test('given: string with special characters, should: remove them', () => {
    const actual = slugify('hello! @world# $example%');
    const expected = 'hello-world-example';

    expect(actual).toEqual(expected);
  });

  test('given: string with dots and hyphens, should: preserve them', () => {
    const actual = slugify('hello.world-example');
    const expected = 'hello.world-example';

    expect(actual).toEqual(expected);
  });

  test('given: string with diacritical marks, should: normalize them', () => {
    const actual = slugify('héllò wórld éxàmplè');
    const expected = 'hello-world-example';

    expect(actual).toEqual(expected);
  });

  test('given: string with multiple consecutive spaces, should: collapse to single hyphen', () => {
    const actual = slugify('hello   world    example');
    const expected = 'hello-world-example';

    expect(actual).toEqual(expected);
  });

  test('given: string with mixed special cases, should: handle all transformations', () => {
    const actual = slugify('  Héllò! @WORLD.example-TEST  ');
    const expected = 'hello-world.example-test';

    expect(actual).toEqual(expected);
  });
});
