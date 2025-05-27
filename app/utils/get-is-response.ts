import type { DataWithResponseInit } from './http-responses.server';

/**
 * Checks if the given value is a response.
 *
 * @param response - The value to check if it is a response.
 * @returns `true` if the value is a response, `false` otherwise.
 */
export function getIsResponse(
  response: unknown,
): response is Response | DataWithResponseInit<unknown> {
  if (response instanceof Response) {
    return true;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'init' in response
  ) {
    return true;
  }

  return false;
}
