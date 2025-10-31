import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
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
              console.log('tRPC non-JSON response', { status: res.status, text: text.slice(0, 120) });
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
