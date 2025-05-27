import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  );
}
