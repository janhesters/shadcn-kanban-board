import './app.css';

import { useTranslation } from 'react-i18next';
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import { useRouteError } from 'react-router';
import { useChangeLanguage } from 'remix-i18next/react';
import { HoneypotProvider } from 'remix-utils/honeypot/react';
import { promiseHash } from 'remix-utils/promise';
import sonnerStyles from 'sonner/dist/styles.css?url';

import i18next from '~/utils/i18next.server';

import type { Route } from './+types/root';
import { NotFound } from './components/not-found';
import { Toaster } from './components/ui/sonner';
import { getColorScheme } from './features/color-scheme/color-scheme.server';
import { ColorSchemeScript } from './features/color-scheme/color-scheme-script';
import { useColorScheme } from './features/color-scheme/use-color-scheme';
import { useToast } from './hooks/use-toast';
import { honeypot } from './utils/honeypot.server';
import { getToast } from './utils/toast.server';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: sonnerStyles },
];

export const handle = { i18n: ['common', 'color-scheme'] };

/**
 * By enabling single fetch, the loaders will no longer revalidate the data when the action status is in the 4xx range.
 * This behavior will prevent toasts from being displayed for failed actions.
 * so, we opt in to revalidate the root loader data when the action status is in the 4xx range.
 */
export const shouldRevalidate = ({
  defaultShouldRevalidate,
  actionStatus,
}: ShouldRevalidateFunctionArgs) => {
  if (actionStatus && actionStatus > 399 && actionStatus < 500) {
    return true;
  }

  return defaultShouldRevalidate;
};

export async function loader({ request }: Route.LoaderArgs) {
  const { colorScheme, honeypotInputProps, locale, t, toastData } =
    await promiseHash({
      colorScheme: getColorScheme(request),
      honeypotInputProps: honeypot.getInputProps(),
      locale: i18next.getLocale(request),
      t: i18next.getFixedT(request),
      toastData: getToast(request),
    });
  const title = t('app-name');
  const { toast, headers: toastHeaders } = toastData;
  return data(
    {
      colorScheme,
      honeypotInputProps,
      locale,
      title,
      toast,
    },
    { headers: toastHeaders },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export function Layout({
  children,
}: { children: React.ReactNode } & Route.ComponentProps) {
  const data = useLoaderData<typeof loader>();
  const locale = data?.locale ?? 'en';
  const error = useRouteError();
  const isErrorFromRoute = isRouteErrorResponse(error);
  const colorScheme = useColorScheme();

  const { i18n } = useTranslation();

  useChangeLanguage(locale);
  useToast(data?.toast);

  return (
    <html
      className={colorScheme}
      lang={locale}
      dir={i18n.dir()}
      // When the user a.) has their system color scheme set to "dark", and b.)
      // picks "system" in the theme toggle, the color scheme is undefined from
      // the root loader, but "dark" in the client. There won't be a flash
      // because the `ColorSchemeScript` will set the correct class name using
      // `useLayoutEffect`.
      suppressHydrationWarning
    >
      <head>
        <ColorSchemeScript />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {isErrorFromRoute && (
          <title>{`${error.status} ${error.statusText}`}</title>
        )}
      </head>

      <body className="min-h-svh">
        <HoneypotProvider {...data?.honeypotInputProps}>
          {children}
        </HoneypotProvider>
        <ScrollRestoration />
        <Toaster position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

function BaseErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function ErrorBoundary({ error, ...props }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound className="min-h-svh" />;
  }

  return <BaseErrorBoundary error={error} {...props} />;
}
