import { render } from '@react-email/components';
import type { ReactElement } from 'react';
import { z } from 'zod';

/**
 * Renders a React email component into both HTML and plain text formats.
 *
 * @param react - The React element to render as an email
 * @returns A promise that resolves to an object containing both HTML and plain
 * text versions of the email
 * @example
 * const email = await renderReactEmail(<WelcomeEmail />);
 * // Returns: { html: "<div>...</div>", text: "Welcome..." }
 */
async function renderReactEmail(react: ReactElement) {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);
  return { html, text };
}

const resendErrorSchema = z.union([
  z.object({
    name: z.string(),
    message: z.string(),
    statusCode: z.number(),
  }),
  z.object({
    name: z.literal('UnknownError'),
    message: z.literal('Unknown Error'),
    statusCode: z.literal(500),
    cause: z.any(),
  }),
]);

type ResendError = z.infer<typeof resendErrorSchema>;

const resendSuccessSchema = z.object({ id: z.string() });

/**
 * Sends an email using the Resend API. The email can be specified either as a
 * React component or as raw HTML and plain text content.
 *
 * @param to - The recipient's email address
 * @param subject - The email subject line
 * @param react - A React component to render as the email content (mutually
 * exclusive with html/text)
 * @param html - The HTML version of the email content (mutually exclusive with
 * react)
 * @param text - The plain text version of the email content (mutually exclusive
 * with react)
 *
 * @returns A promise that resolves to either:
 * - A success result with the email ID:
 * `{ status: 'success', data: { id: string } }`
 * - An error result with details:
 * `{ status: 'error', error: ResendError }`
 *
 * @example
 * // Using a React component
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   react: <WelcomeEmail />
 * });
 *
 * @example
 * // Using raw HTML and text
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<h1>Welcome</h1><p>Thanks for joining!</p>',
 *   text: 'Welcome\n\nThanks for joining!'
 * });
 */
export async function sendEmail({
  react,
  ...options
}: {
  to: string;
  subject: string;
} & (
  | { html: string; text: string; react?: never }
  | { react: ReactElement; html?: never; text?: never }
)) {
  const from = 'hello@react-router-saas-template.com';

  const email = {
    from,
    ...options,
    ...(react ? await renderReactEmail(react) : {}),
  };

  // feel free to remove this condition once you've set up resend
  if (!process.env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY not set.`);
    console.error(
      `To send emails, set the RESEND_API_KEY environment variable.`,
    );
    console.error(
      `Would have sent the following email:`,
      JSON.stringify(email),
    );
    return { status: 'success', data: { id: 'mocked' } } as const;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    body: JSON.stringify(email),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  const data = (await response.json()) as unknown;
  const parsedData = resendSuccessSchema.safeParse(data);

  if (response.ok && parsedData.success) {
    return { status: 'success', data: parsedData } as const;
  } else {
    const parseResult = resendErrorSchema.safeParse(data);
    return parseResult.success
      ? ({ status: 'error', error: parseResult.data } as const)
      : ({
          status: 'error',
          error: {
            name: 'UnknownError',
            message: 'Unknown Error',
            statusCode: 500,
            cause: data,
          } satisfies ResendError,
        } as const);
  }
}
