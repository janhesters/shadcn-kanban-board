import type { ReactElement } from 'react';
import type { ErrorResponse } from 'react-router';
import { isRouteErrorResponse, useParams, useRouteError } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { getErrorMessage } from '~/utils/get-error-message';

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => ReactElement | null;

const ErrorMessage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex h-full flex-col p-2">
    <Alert
      className="bg-destructive/10 dark:bg-destructive/5 border-destructive/50 dark:border-destructive/80 flex h-full flex-col items-center justify-center"
      variant="destructive"
    >
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  </div>
);

/**
 * @see https://github.com/epicweb-dev/epic-stack/blob/main/app/components/error-boundary.tsx
 */
export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <ErrorMessage
      title={`${error.status} ${error.statusText}`}
      description={error.data as string}
    />
  ),
  statusHandlers = {
    404: ({ error }) => {
      throw error;
    },
  },
  unexpectedErrorHandler = error => (
    <ErrorMessage title="Oh snap!" description={getErrorMessage(error)} />
  ),
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => ReactElement | null;
}) {
  const error = useRouteError();
  const params = useParams();

  if (typeof document !== 'undefined') {
    console.error('client error in general error boundary', error);
  }

  return (
    <div className="h-full">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </div>
  );
}
