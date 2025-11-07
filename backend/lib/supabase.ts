import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RAW_URL = (process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const RAW_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '').trim();
const RAW_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const hasValidUrl = !!RAW_URL && /^https?:\/\//i.test(RAW_URL);
const serviceKey = RAW_SERVICE_ROLE_KEY || RAW_ANON_KEY;

function createUnavailableClient(reason: string): SupabaseClient<any, "public", any> {
  console.error('[backend:supabase] Client unavailable:', reason);
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error(`[backend:supabase] ${reason}`);
    },
  };
  return new Proxy({} as unknown as SupabaseClient, handler);
}

export const supabaseServer: SupabaseClient = hasValidUrl && !!serviceKey
  ? createClient(RAW_URL, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'motofast-backend',
        },
      },
    })
  : createUnavailableClient('Supabase not configured on server. Define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_KEY.');
