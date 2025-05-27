import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * Sets up a mock server with lifecycle hooks for testing, using MSW and Vitest.
 * Configures the server to start before all tests, reset handlers after each
 * test, and close after all tests.
 *
 * @param handlers - A spread array of MSW `RequestHandler`s defining the mock
 * API behavior.
 * @returns The MSW server instance.
 *
 * @remark Multiple `afterEach` hooks (etc.) are cumulative and executed
 * sequentially, if you need other `afterEach` hooks to run in addition to the
 * ones defined in this function.
 *
 * @example
 * ```ts
 * import { describe, expect, test } from 'vitest';
 * import { http, HttpResponse } from 'msw';
 * import { setupMockServerLifecycle } from './test-utils';
 *
 * const handler = http.get('/api/example', () => {
 *   return HttpResponse.json({ id: 1 });
 * });
 *
 * setupMockServerLifecycle(handler);
 *
 * describe('API tests', () => {
 *   test('given: a request, should: mock the API response', async () => {
 *     const response = await fetch('/api/example');
 *     const data = await response.json();
 *     expect(data).toEqual({ id: 1 });
 *   });
 * });
 * ```
 */
export function setupMockServerLifecycle(...handlers: RequestHandler[]) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}
