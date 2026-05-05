import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies.set(name, value, { ...options, path: options.path ?? '/' });
        },
        remove(name: string, options: CookieOptions) {
          cookies.delete(name, { ...options, path: options.path ?? '/' });
        },
      },
    }
  );
}

export function createSupabaseAdminClient() {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
