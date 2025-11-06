import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = ((Constants as any)?.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const RAW_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '').trim();
const RAW_KEY = (process.env.EXPO_PUBLIC_SUPABASE_KEY ?? extra.EXPO_PUBLIC_SUPABASE_KEY ?? extra.supabaseKey ?? '').trim();

const hasValidUrl = !!RAW_URL && /^https?:\/\//i.test(RAW_URL);
const hasKey = !!RAW_KEY;

function createUnavailableClient(reason: string): SupabaseClient {
  console.error('[supabase] Client unavailable:', reason);
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error(`[supabase] ${reason}`);
    },
  };
  return new Proxy({} as unknown as SupabaseClient, handler);
}

if (!hasValidUrl || !hasKey) {
  console.warn('[supabase] Missing or invalid configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY.');
}

export const supabase: SupabaseClient = hasValidUrl && hasKey
  ? createClient(RAW_URL, RAW_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createUnavailableClient('Supabase not configured. Define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your env or app.json extra.');
