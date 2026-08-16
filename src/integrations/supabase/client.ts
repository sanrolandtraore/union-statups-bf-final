import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!rawSupabaseUrl || !rawPublishableKey) {
  throw new Error(
    "[Union'S] Configuration Supabase manquante : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY " +
    "doivent être définies dans les variables d'environnement."
  );
}

/**
 * VITE_SUPABASE_URL must point to the Supabase project root.
 * Some dashboards expose the REST endpoint as `/rest/v1`; accepting that
 * accidental suffix here prevents the browser from calling an invalid Auth URL.
 * We never fall back to another project or hard-code credentials.
 */
const normalizeSupabaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  const url = new URL(trimmed);
  const pathname = url.pathname.replace(/\/+$/, '');

  if (pathname === '/rest/v1') {
    url.pathname = '';
    url.search = '';
    url.hash = '';
  }

  return url.toString().replace(/\/$/, '');
};

const SUPABASE_URL = normalizeSupabaseUrl(rawSupabaseUrl);
const SUPABASE_PUBLISHABLE_KEY = rawPublishableKey.trim().replace(/^['"]|['"]$/g, '');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
