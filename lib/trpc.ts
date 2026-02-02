import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("[TRPC] EXPO_PUBLIC_RORK_API_BASE_URL is not set");
    return "";
  }

  return url;
};

const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const response = await fetch(url, options);
  
  const contentType = response.headers.get('content-type') || '';
  
  if (!response.ok || !contentType.includes('application/json')) {
    const text = await response.text();
    
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
      console.error('[TRPC] Received HTML instead of JSON. URL:', url);
      console.error('[TRPC] Status:', response.status);
      console.error('[TRPC] This usually means the API endpoint is incorrect or the backend is not deployed.');
      
      throw new Error('TRPC_ENDPOINT_UNREACHABLE');
    }
    
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  
  return response;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: customFetch,
    }),
  ],
});
