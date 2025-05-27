/* eslint-disable @typescript-eslint/only-throw-error */
import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { getErrorMessage } from './get-error-message';

describe('getErrorMessage()', () => {
  test("given: an error, should: return the error's message", () => {
    const message = faker.word.words();

    const actual = getErrorMessage(new Error(message));
    const expected = message;

    expect(actual).toEqual(expected);
  });

  test('given: a string is thrown, should: return the string', () => {
    expect.assertions(1);

    const someString = faker.lorem.words();

    try {
      throw someString;
    } catch (error) {
      const actual = getErrorMessage(error);
      const expected = someString;

      expect(actual).toEqual(expected);
    }
  });

  test('given: a number is thrown, should: return the number as a string', () => {
    expect.assertions(1);

    const someNumber = 1;

    try {
      throw someNumber;
    } catch (error) {
      const actual = getErrorMessage(error);
      const expected = JSON.stringify(someNumber);

      expect(actual).toEqual(expected);
    }
  });

  test("given: an error that extends a custom error class, should: return the error's message", () => {
    class CustomError extends Error {
      public constructor(message: string) {
        super(message);
      }
    }

    const message = faker.word.words();

    const actual = getErrorMessage(new CustomError(message));
    const expected = message;

    expect(actual).toEqual(expected);
  });

  test("given: a custom error object with a message property, should: return the object's message property", () => {
    const message = faker.word.words();

    const actual = getErrorMessage({ message });
    const expected = message;

    expect(actual).toEqual(expected);
  });

  test('given: circular references, should: handle them gracefully', () => {
    expect.assertions(1);

    const object = { circular: this };

    try {
      throw object;
    } catch (error) {
      const actual = getErrorMessage(error);
      const expected = '[object Object]';

      expect(actual).toEqual(expected);
    }
  });
});
