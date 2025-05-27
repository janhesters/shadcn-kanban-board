import { describe, expect, test } from 'vitest';

import { toFormData } from './to-form-data';

describe('toFormData()', () => {
  test('given: an object, should: return the valid form data', () => {
    const payload = {
      text: 'Hello',
      file: new Blob(['content'], { type: 'text/plain' }),
      questions: ['What is up?', 'Can you tell me?'],
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append('text', 'Hello');
    expected.append('file', new Blob(['content'], { type: 'text/plain' }));
    expected.append('questions', 'What is up?');
    expected.append('questions', 'Can you tell me?');

    expect(actual).toEqual(expected);
  });

  test('given: an empty object, should: return an empty form data', () => {
    const payload = {};

    const actual = toFormData(payload);
    const expected = new FormData();

    expect(actual).toEqual(expected);
  });

  test('given: an object with only string values, should: return the valid form data', () => {
    const payload = {
      name: 'John Doe',
      age: '30',
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append('name', 'John Doe');
    expected.append('age', '30');

    expect(actual).toEqual(expected);
  });

  test('given: an object with only Blob values, should: return the valid form data', () => {
    const payload = {
      file1: new Blob(['content1'], { type: 'text/plain' }),
      file2: new Blob(['content2'], { type: 'text/plain' }),
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append('file1', new Blob(['content1'], { type: 'text/plain' }));
    expected.append('file2', new Blob(['content2'], { type: 'text/plain' }));

    expect(actual).toEqual(expected);
  });

  test('given: an object with only array of string values, should: return the valid form data', () => {
    const payload = {
      colors: ['red', 'blue', 'green'],
      sizes: ['S', 'M', 'L'],
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append('colors', 'red');
    expected.append('colors', 'blue');
    expected.append('colors', 'green');
    expected.append('sizes', 'S');
    expected.append('sizes', 'M');
    expected.append('sizes', 'L');

    expect(actual).toEqual(expected);
  });

  test('given: an object with undefined values, should: skip undefined values in form data', () => {
    const payload = {
      name: 'John Doe',
      age: undefined,
      file: new Blob(['content'], { type: 'text/plain' }),
    };

    const actual = toFormData(payload);
    const expected = new FormData();
    expected.append('name', 'John Doe');
    expected.append('file', new Blob(['content'], { type: 'text/plain' }));

    expect(actual).toEqual(expected);
  });
});
