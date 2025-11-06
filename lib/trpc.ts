import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { AppRouter } from '@/backend/trpc/app-router';

export const trpc = createTRPCReact<AppRouter>();

const sanitizeUrl = (url: string) => url.replace(/\/$/, "");
const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

export const getBaseUrl = () => {
  const envCandidates = [
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    process.env.EXPO_PUBLIC_API_URL,
  ].filter(Boolean) as string[];

  const rawEnv = envCandidates[0] ?? "";
  if (rawEnv) {
    if (!isHttpUrl(rawEnv)) {
      console.error("Invalid backend URL. Must start with http:// or https://");
      return "";
    }
    return sanitizeUrl(rawEnv);
  }

  if (Platform.OS === "web") {
    return "";
  }

  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    const isPublic = /ngrok|trycloudflare|rork|vercel|\.app|\.dev/i.test(hostUri);
    const base = hostUri.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return sanitizeUrl(`${isPublic ? 'https' : 'http'}://${base}`);
  }

  console.warn("Backend URL missing. Set EXPO_PUBLIC_BACKEND_URL to your API base.");
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${getBaseUrl()}/api/trpc`,
      async headers() {
        try {
          const token = await AsyncStorage.getItem('access_token');
          const lang = (await AsyncStorage.getItem('@motofast-language')) ?? (await AsyncStorage.getItem('user_language')) ?? undefined;
          return {
            'content-type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(lang ? { 'Accept-Language': lang } : {}),
          } as Record<string, string>;
        } catch {
          return { 'content-type': 'application/json' } as Record<string, string>;
        }
      },
      fetch(url, options) {
        console.log('🚀 tRPC Request:', {
          url: String(url),
          method: options?.method,
        });
        return fetch(url, options).then(async (res) => {
          const ct = res.headers.get("content-type") ?? "";
          console.log('⬇️ tRPC Response:', {
            url: String(url),
            status: res.status,
            contentType: ct,
          });

          if (!res.ok) {
            console.error(`❌ tRPC HTTP Error ${res.status}`);
          }

          if (!ct.includes("application/json")) {
            try {
              const text = await res.clone().text();
              console.error("❌ tRPC non-JSON response:", {
                url: String(url),
                status: res.status,
                contentType: ct,
                preview: text.slice(0, 300),
              });

              if (!res.ok) {
                throw new Error(`Erro do servidor (${res.status}). Por favor, tente novamente.`);
              }
            } catch (err) {
              if (err instanceof Error && err.message.includes('Erro do servidor')) {
                throw err;
              }
              console.warn("⚠️ Could not read response text", err);
            }
          }
          return res;
        }).catch((err) => {
          console.error('❌ tRPC fetch error:', err.message || err);
          throw err;
        });
      },
    }),
  ],
});
