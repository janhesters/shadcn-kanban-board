import { describe, expect, test } from 'vitest';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';

import { getIsDataWithResponseInit } from './get-is-data-with-response-init.server';
import { throwIfEntityIsMissing } from './throw-if-entity-is-missing.server';

describe('throwIfEntityIsMissing()', () => {
  test('given: an an entity, should: return the entity', () => {
    const organization = createPopulatedOrganization();

    const actual = throwIfEntityIsMissing(organization);
    const expected = organization;

    expect(actual).toEqual(expected);
  });

  test('given: null, should: throw a 404 not found error', () => {
    expect.assertions(2);

    try {
      throwIfEntityIsMissing(null);
    } catch (error) {
      if (getIsDataWithResponseInit(error)) {
        expect(error.init?.status).toEqual(404);
        expect(error.data).toEqual({ message: 'Not Found' });
      }
    }
  });
});
