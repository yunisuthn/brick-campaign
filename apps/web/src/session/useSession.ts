import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client.js';
import { SESSION_KEY, type SessionUser } from './keys.js';

/** Signed out is an answer, not an error: a 401 on /auth/me resolves to null. */
async function fetchSession(): Promise<SessionUser | null> {
  try {
    return await api.get<SessionUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/**
 * The session is read once at start-up and then trusted until a 401 comes back (the cookie
 * lasts thirty days): no periodic check.
 */
export function useSession() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: fetchSession, staleTime: Infinity });
}

export interface Credentials {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Credentials) => api.post<SessionUser>('/auth/login', credentials),
    onSuccess: (user) => queryClient.setQueryData(SESSION_KEY, user),
  });
}

/** Everything cached belongs to the person who just left: the whole cache goes, not only the session. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(SESSION_KEY, null);
    },
  });
}
