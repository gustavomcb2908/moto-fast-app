import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envCandidates = [
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  ].filter(Boolean) as string[];

  if (envCandidates.length > 0) {
    return envCandidates[0] as string;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  throw new Error(
    "No base url found. Set EXPO_PUBLIC_BACKEND_URL or EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, options).then(async (res) => {
          try {
            const ct = res.headers.get('content-type') ?? '';
            if (!ct.includes('application/json')) {
              const clone = res.clone();
              const text = await clone.text();
              console.log('tRPC non-JSON response', { url: String(url), status: res.status, text: text.slice(0, 200) });
            }
          } catch (e) {
            console.log('tRPC fetch inspector error', e);
          }
          return res;
        });
      },
    }),
  ],
});
