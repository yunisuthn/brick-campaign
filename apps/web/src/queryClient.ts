import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client.js';
import { SESSION_KEY } from './session/keys.js';

/** A 4xx answer will not change on retry; a network or 5xx failure gets one more try. */
function retry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}

/**
 * Two people entering the day's figures in the evening: refetching on focus brings nothing.
 * Any 401, from any call, means the cookie is gone: the session is marked out and the route
 * guard sends the user to the login screen, no reload needed.
 */
export function createQueryClient(): QueryClient {
  const onSessionLost = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      client.setQueryData(SESSION_KEY, null);
    }
  };
  const client = new QueryClient({
    queryCache: new QueryCache({ onError: onSessionLost }),
    mutationCache: new MutationCache({ onError: onSessionLost }),
    defaultOptions: {
      queries: { retry, refetchOnWindowFocus: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
  return client;
}
