import type { FieldErrors } from 'react-hook-form';
import { describe, expect, test } from 'vitest';

import { getFormErrors } from './get-form-errors';

type TestFormFields = {
  email: string;
};

type TestFormData =
  | {
      email?: string;
      errors?: FieldErrors<TestFormFields>;
    }
  | Response;

describe('getFormErrors()', () => {
  test('given: a form data object with errors, should: return the errors', () => {
    const errors: FieldErrors<TestFormFields> = {
      email: { type: 'validation', message: 'Invalid email' },
    };
    const data: TestFormData = { errors };

    const actual = getFormErrors<TestFormData>(data);
    const expected = errors;

    expect(actual).toEqual(expected);
  });

  test('given: a form data object without errors, should: return undefined', () => {
    const data: TestFormData = { email: 'test@example.com' };

    const actual = getFormErrors<TestFormData>(data);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: undefined, should: return undefined', () => {
    const data = undefined;

    const actual = getFormErrors<TestFormData | undefined>(data);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: empty object, should: return undefined', () => {
    const data: TestFormData = {};

    const actual = getFormErrors<TestFormData>(data);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test('given: Response object, should: return undefined', () => {
    const data = new Response();

    const actual = getFormErrors<TestFormData>(data);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });
});
