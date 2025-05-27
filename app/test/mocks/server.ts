import type { RequestHandler } from 'msw';
import type { SetupServer } from 'msw/node';
import { setupServer } from 'msw/node';

import { onUnhandledRequest } from './msw-utils';
import { remixPingHandler } from './msw-utils.server';

/**
 * During development, we need to save the instance of our MSW server in a
 * global variable.
 * Remix purges the 'require' cache on every request in development to support
 * <LiveReload /> functionality from the server to the browser.
 * To make sure our cache survives these purges during development, we need to
 * assign it to the `global` object
 *
 * Details: https://stackoverflow.com/questions/72661999/how-do-i-use-in-memory-cache-in-remix-run-dev-mode
 * Inspired by: https://github.com/kettanaito/msw-with-remix/blob/main/app/mocks/server.ts
 * And: https://github.com/cliffordfajardo/remix-msw-node-with-playwright/blob/main/app/msw-server.ts
 */
declare global {
  // eslint-disable-next-line no-var
  var __MSW_SERVER: SetupServer | undefined;
}

function setup(handlers: RequestHandler[]) {
  const server = setupServer(remixPingHandler, ...handlers);
  globalThis.__MSW_SERVER = server;
  return server;
}

function start(server: SetupServer) {
  server.listen({ onUnhandledRequest });
  console.info('🔶 MSW mock server running ...');

  process.once('SIGINT', () => {
    globalThis.__MSW_SERVER = undefined;
    server.close();
  });

  process.once('SIGTERM', () => {
    globalThis.__MSW_SERVER = undefined;
    server.close();
  });
}

function restart(server: SetupServer, handlers: RequestHandler[]) {
  console.info('🔶 Shutting down MSW Mock Server ...');
  server.close();

  console.info('🔶 Attempting to restart MSW Mock Server ...');
  start(setup(handlers));
}

export function startMockServer(handlers: RequestHandler[]) {
  const persistedServer = globalThis.__MSW_SERVER;

  if (persistedServer === undefined) {
    start(setup(handlers));
  } else {
    restart(persistedServer, handlers);
  }
}
