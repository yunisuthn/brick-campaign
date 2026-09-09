import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client.js';

/** A 4xx answer will not change on retry; a network or 5xx failure gets one more try. */
function retry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}

/** Two people entering the day's figures in the evening: refetching on focus brings nothing. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry, refetchOnWindowFocus: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}
