import { http, passthrough } from 'msw';

const REMIX_DEV_PING = new URL(
  process?.env?.REMIX_DEV_ORIGIN ?? 'http://test-origin',
);
REMIX_DEV_PING.pathname = '/ping';

/**
 * Lets MSW forward internal "dev ready" messages on `/ping`.
 *
 * @see https://remix.run/docs/en/main/other-api/dev#how-to-set-up-msw
 *
 * @returns A response object for the remix ping request.
 */
export const remixPingHandler = http.post(REMIX_DEV_PING.href, () =>
  passthrough(),
);
