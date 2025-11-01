import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const trpc = createTRPCReact<AppRouter>();

const sanitizeUrl = (url: string) => url.replace(/\/$/, "");
const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const getBaseUrl = () => {
  const envCandidates = [
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  ].filter(Boolean) as string[];

  const rawEnv = envCandidates[0] ?? "";
  if (rawEnv) {
    if (!isHttpUrl(rawEnv)) {
      console.error("Invalid EXPO_PUBLIC_BACKEND_URL. Must start with http:// or https://");
      return "";
    }
    return sanitizeUrl(rawEnv);
  }

  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return sanitizeUrl(window.location.origin);
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
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const token = await AsyncStorage.getItem('access_token');
          const lang = (await AsyncStorage.getItem('@motofast-language')) ?? (await AsyncStorage.getItem('user_language')) ?? undefined;
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(lang ? { 'Accept-Language': lang } : {}),
          } as Record<string, string>;
        } catch {
          return {} as Record<string, string>;
        }
      },
      fetch(url, options) {
        console.log('🚀 tRPC Request:', {
          url: String(url),
          method: options?.method,
        });
        return fetch(url, options).then(async (res) => {
          try {
            const ct = res.headers.get("content-type") ?? "";
            console.log('⬇️ tRPC Response:', {
              url: String(url),
              status: res.status,
              contentType: ct,
            });
            if (!ct.includes("application/json")) {
              const text = await res.clone().text();
              console.log("❌ tRPC non-JSON response", {
                url: String(url),
                status: res.status,
                text: text.slice(0, 500),
              });
            }
          } catch (err) {
            console.log("❌ tRPC fetch inspector error", err);
          }
          return res;
        });
      },
    }),
  ],
});
