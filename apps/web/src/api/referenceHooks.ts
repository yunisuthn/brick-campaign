import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

/**
 * Reference data (moulders, rice fields, clients) share one API shape: list, read, create,
 * patch, no delete. The hooks are built once per resource from its path and cache name.
 * Any change leaves every list stale, so every list is invalidated; the answer seeds the
 * detail cache so the page shown next does not fetch what it already has.
 */
export function referenceHooks<T extends { id: string }, New, Patch>(name: string, path: string) {
  const KEY = [name] as const;
  const listKey = (search: string) => [...KEY, 'list', search] as const;
  const oneKey = (id: string) => [...KEY, id] as const;

  function useList(search = '') {
    return useQuery({ queryKey: listKey(search), queryFn: () => api.get<T[]>(`${path}${search}`) });
  }

  function useOne(id: string) {
    return useQuery({ queryKey: oneKey(id), queryFn: () => api.get<T>(`${path}/${id}`) });
  }

  function useChange<TInput>(request: (input: TInput) => Promise<T>) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: request,
      onSuccess: (item) => {
        queryClient.setQueryData(oneKey(item.id), item);
        return queryClient.invalidateQueries({ queryKey: [...KEY, 'list'] });
      },
    });
  }

  function useCreate() {
    return useChange((input: New) => api.post<T>(path, input));
  }

  function useUpdate(id: string) {
    return useChange((patch: Patch) => api.patch<T>(`${path}/${id}`, patch));
  }

  return { useList, useOne, useCreate, useUpdate };
}
