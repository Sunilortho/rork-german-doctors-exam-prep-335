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
  let response: Response;
  
  try {
    response = await fetch(url, options);
  } catch (fetchError: any) {
    console.error('[TRPC] Network fetch error:', fetchError?.message);
    throw new Error('TRPC_NETWORK_ERROR');
  }
  
  const contentType = response.headers.get('content-type') || '';
  
  if (!contentType.includes('application/json')) {
    let text = '';
    try {
      text = await response.text();
    } catch {
      text = '';
    }
    
    console.error('[TRPC] Non-JSON response. URL:', url);
    console.error('[TRPC] Status:', response.status, 'Content-Type:', contentType);
    console.error('[TRPC] Body preview:', text.substring(0, 200));
    
    if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
      throw new Error('TRPC_ENDPOINT_UNREACHABLE');
    }
    
    if (text.startsWith('Not Found') || text.startsWith('Null') || text.startsWith('null')) {
      throw new Error('TRPC_ENDPOINT_NOT_FOUND');
    }
    
    if (!response.ok) {
      throw new Error(`TRPC_ERROR_${response.status}`);
    }
    
    const jsonError = {
      error: {
        message: 'TRPC_INVALID_RESPONSE',
        code: 'INTERNAL_SERVER_ERROR',
        data: { httpStatus: response.status, text: text.substring(0, 100) }
      }
    };
    
    return new Response(JSON.stringify(jsonError), {
      status: 500,
      headers: { 'content-type': 'application/json' },
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
