import type { DataWithResponseInit } from './http-responses.server';

export function getIsDataWithResponseInit<T>(
  error: unknown,
): error is DataWithResponseInit<T> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'DataWithResponseInit'
  );
}
