import type { UnhandledRequestCallback } from 'node_modules/msw/lib/core/utils/request/onUnhandledRequest';

/**
 * Callback function to handle unhandled requests in MSW (Mock Service Worker).
 *
 * @param request - The unhandled request object.
 */
export const onUnhandledRequest: UnhandledRequestCallback = request => {
  // Opt out of request to localhost on the client and server.
  if (new URL(request.url).href.startsWith('http://localhost')) {
    return;
  }

  console.warn(
    '[MSW] Warning: captured a request without a matching request handler:\n\n',
    `  • ${request.method} ${new URL(request.url).href}\n\n`,
    'If you still wish to intercept this unhandled request, please create a request handler for it.\n',
    'Read more: https://mswjs.io/docs/getting-started/mocks',
  );
};
