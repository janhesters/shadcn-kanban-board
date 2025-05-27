/* eslint-disable unicorn/no-null */
import { createId } from '@paralleldrive/cuid2';
import { createCookieSessionStorage, redirect } from 'react-router';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { combineHeaders } from './combine-headers.server';

const { NODE_ENV, SESSION_SECRET } = process.env;

invariant(SESSION_SECRET, 'SESSION_SECRET is required');

const { commitSession, destroySession, getSession } =
  createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      name: '__toast',
      path: '/',
      sameSite: 'lax',
      secrets: [SESSION_SECRET],
      secure: NODE_ENV === 'production',
    },
  });

const ToastSchema = z.object({
  description: z.string().optional(),
  id: z.string().default(createId),
  title: z.string().optional(),
  type: z.enum(['message', 'error', 'info', 'success']).default('message'),
});

export type Toast = z.infer<typeof ToastSchema>;
export type ToastInput = Omit<Toast, 'id' | 'type'> &
  Partial<Pick<Toast, 'id' | 'type'>>;

const TOAST_KEY = 'toast';

/**
 * Retrieves a toast message from the user's session.
 * Validates and fetches the toast message from session cookies. Returns the
 * toast message and the necessary 'Set-Cookie' header to manage the session.
 *
 * @param request - The incoming request with session cookies.
 * @returns An object with the toast message and session headers.
 */
export async function getToast(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const cookies = session.get(TOAST_KEY) as unknown as ToastInput | undefined;
  const result = ToastSchema.safeParse(cookies);
  const toast = result.success ? result.data : null;
  return {
    toast,
    headers: toast
      ? new Headers({ 'Set-Cookie': await destroySession(session) })
      : undefined,
  };
}

/**
 * Creates headers for storing a toast message in the session.
 * Parses and stores the `toastInput` in the session, returning the 'Set-Cookie'
 * header to commit the updated session. *
 * @param toastInput - Toast message to be stored.
 * @returns Headers object with 'Set-Cookie' for session update.
 */
export async function createToastHeaders(toastInput: ToastInput) {
  const toast = ToastSchema.parse(toastInput);
  const session = await getSession();
  session.flash(TOAST_KEY, toast);
  return new Headers({ 'Set-Cookie': await commitSession(session) });
}

/**
 * Creates a redirect response to a specified URL, including a toast message.
 * The function sets a toast message in the session headers and combines these
 * with any additional headers provided in the `init` parameter.
 *
 * @param url - The URL to redirect to.
 * @param toast - The toast message to be displayed after the redirect.
 * @param init - Optional additional response initialization settings.
 * @returns - A Response object configured for redirection with toast message
 * headers.
 */
export async function redirectWithToast(
  url: string,
  toast: ToastInput,
  init?: ResponseInit,
) {
  return redirect(url, {
    ...init,
    headers: combineHeaders(init?.headers, await createToastHeaders(toast)),
  });
}
