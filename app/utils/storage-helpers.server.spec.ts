import { describe, expect, test } from 'vitest';

import { getBucketAndKeyFromUrl } from './storage-helpers.server';

describe('getBucketAndKeyFromUrl()', () => {
  test('given: a null url, should: return undefined bucket and key', () => {
    const actual = getBucketAndKeyFromUrl(null);
    const expected = { bucket: undefined, key: undefined };

    expect(actual).toEqual(expected);
  });

  test.each([
    {
      url: 'https://project-ref.supabase.co/storage/v1/object/public/app-images/user-avatars/gfcqufunx7kdf20k54bdhpez/jan-2.png',
      expected: {
        bucket: 'app-images',
        key: 'user-avatars/gfcqufunx7kdf20k54bdhpez/jan-2.png',
      },
    },
    {
      url: 'https://project-ref.supabase.co/storage/v1/object/public/app-images/organization-logos/oxws924a0m8zq86ui9yogg6n/maxresdefault.jpg',
      expected: {
        bucket: 'app-images',
        key: 'organization-logos/oxws924a0m8zq86ui9yogg6n/maxresdefault.jpg',
      },
    },
    {
      url: 'https://project-ref.supabase.co/storage/v1/object/public/app-files/organization-logos/oxws924a0m8zq86ui9yogg6n/maxresdefault.jpg',
      expected: {
        bucket: 'app-files',
        key: 'organization-logos/oxws924a0m8zq86ui9yogg6n/maxresdefault.jpg',
      },
    },
    {
      url: 'https://project-ref.supabase.co/storage/v1/object/public/app-images/user-avatars/gfcqufunx7kdf20k54bdhpez.JPG',
      expected: {
        bucket: 'app-images',
        key: 'user-avatars/gfcqufunx7kdf20k54bdhpez.JPG',
      },
    },
    {
      url: 'https://project-ref.supabase.co/storage/v1/render/image/public/app-images/user-avatars/gfcqufunx7kdf20k54bdhpez/avatar.png?width=128&height=128&resize=cover',
      expected: {
        bucket: 'app-images',
        key: 'user-avatars/gfcqufunx7kdf20k54bdhpez/avatar.png',
      },
    },
  ])(
    'given: a url $url, should: return bucket $expected.bucket and key $expected.key',
    ({ url, expected }) => {
      const actual = getBucketAndKeyFromUrl(url);
      expect(actual).toEqual(expected);
    },
  );

  test('given: an invalid URL string, should: throw error "Invalid URL"', () => {
    const url = 'not a url';
    expect(() => getBucketAndKeyFromUrl(url)).toThrow('Invalid URL');
  });
});
