import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import invariant from 'tiny-invariant';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
  process.env;

invariant(VITE_SUPABASE_URL, 'VITE_SUPABASE_URL is not set');
invariant(VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY is not set');
invariant(SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is not set');

export function createSupabaseServerClient({ request }: { request: Request }) {
  const headers = new Headers();

  const supabase = createServerClient(
    VITE_SUPABASE_URL!,
    VITE_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: 'pkce' },
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
            name: string;
            value: string;
          }[];
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet)
            headers.append(
              'Set-Cookie',
              serializeCookieHeader(name, value, options),
            );
        },
      },
    },
  );

  return { supabase, headers };
}

export const supabaseAdminClient = createClient(
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);
