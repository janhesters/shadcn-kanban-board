import path from 'node:path';
import { PassThrough } from 'node:stream';

import { createReadableStreamFromReadable } from '@react-router/node';
import { createInstance } from 'i18next';
import Backend from 'i18next-fs-backend';
import { isbot } from 'isbot';
import { createElement } from 'react';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

import i18n from '~/utils/i18n';
import i18next from '~/utils/i18next.server';

export const streamTimeout = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const instance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(routerContext);

  await instance
    .use(initReactI18next)
    .use(Backend)
    .init({
      ...i18n,
      lng,
      ns,
      backend: {
        loadPath: process.env.VERCEL
          ? path.resolve('build', 'client', './locales/{{lng}}/{{ns}}.json')
          : path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
      },
    });

  return new Promise<Response>((resolve, reject) => {
    let didError = false;
    const userAgent = request.headers.get('user-agent') ?? '';
    const onAllReady =
      isbot(userAgent) || routerContext.isSpaMode
        ? 'onAllReady'
        : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(
      createElement(
        I18nextProvider,
        { i18n: instance },
        createElement(ServerRouter, {
          context: routerContext,
          url: request.url,
        }),
      ),
      {
        [onAllReady]() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error as Error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      } as RenderToPipeableStreamOptions,
    );

    // Ensure we don't hang forever
    setTimeout(abort, streamTimeout + 1000);
  });
}
