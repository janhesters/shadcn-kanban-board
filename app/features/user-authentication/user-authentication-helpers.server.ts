import { href, redirect } from 'react-router';
import { safeRedirect } from 'remix-utils/safe-redirect';

import { createSupabaseServerClient } from './supabase.server';

/**
 * Verifies that the user is authenticated before allowing access to a protected
 * route.
 *
 * @param request - The incoming request object.
 * @param redirectTo - The path to redirect to after successful login (defaults
 * to current path).
 * @returns Object containing the authenticated user and response headers.
 * @throws Redirect to login page if user is not authenticated.
 */
export async function requireUserIsAuthenticated(
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) {
  const { supabase, headers } = createSupabaseServerClient({ request });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const searchParameters = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(safeRedirect(`/login?${searchParameters.toString()}`), {
      headers,
    });
  }

  return { user, headers, supabase };
}

/**
 * Verifies that the user is not authenticated (anonymous).
 * Used to protect routes that should only be accessible to non-authenticated
 * users.
 *
 * @param request - The incoming request object.
 * @returns Object containing the Supabase client and response headers.
 * @throws Redirect to organizations page if user is already authenticated.
 */
export async function requireUserIsAnonymous(request: Request) {
  const { supabase, headers } = createSupabaseServerClient({ request });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    throw redirect(href('/organizations'), { headers });
  }

  return { supabase, headers };
}

/**
 * Logs out the current user by signing them out of Supabase auth.
 *
 * @param request - The incoming request object.
 * @param redirectTo - The path to redirect to after logout (defaults to root).
 * @returns Redirect response to the login page.
 */
export async function logout(request: Request, redirectTo = '/') {
  const { supabase, headers } = createSupabaseServerClient({ request });
  await supabase.auth.signOut();
  return redirect(safeRedirect(redirectTo), { headers });
}
