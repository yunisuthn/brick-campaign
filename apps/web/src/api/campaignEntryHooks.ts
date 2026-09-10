import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

/** Only the values that are set become query parameters; an empty filter is left out. */
function search(filters: object): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) if (value) params.set(name, String(value));
  const text = params.toString();
  return text === '' ? '' : `?${text}`;
}

/**
 * Entries of a campaign (productions, payments, …) share one API shape: nested under the
 * campaign, listed newest first with filters, created, corrected, and cancelled as a soft
 * delete. The hooks are built once per resource from its path.
 *
 * Any change leaves every list of that campaign stale, filtered or not, so all of them are
 * invalidated; the answer seeds the detail cache. A cancelled entry is gone from the API, so
 * its detail is dropped rather than refreshed.
 */
export function campaignEntryHooks<T extends { id: string }, New, Patch, Filters extends object>(
  name: string,
  path: (campaignId: string) => string,
) {
  const KEY = [name] as const;
  const campaignKey = (campaignId: string) => [...KEY, campaignId] as const;
  const listsKey = (campaignId: string) => [...campaignKey(campaignId), 'list'] as const;
  const listKey = (campaignId: string, filters: Filters) =>
    [...listsKey(campaignId), filters] as const;
  const oneKey = (campaignId: string, id: string) => [...campaignKey(campaignId), id] as const;

  function useList(campaignId: string, filters: Filters) {
    return useQuery({
      queryKey: listKey(campaignId, filters),
      queryFn: () => api.get<T[]>(`${path(campaignId)}${search(filters)}`),
    });
  }

  function useOne(campaignId: string, id: string) {
    return useQuery({
      queryKey: oneKey(campaignId, id),
      queryFn: () => api.get<T>(`${path(campaignId)}/${id}`),
    });
  }

  function useChange<TInput>(campaignId: string, request: (input: TInput) => Promise<T>) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: request,
      onSuccess: (entry) => {
        queryClient.setQueryData(oneKey(campaignId, entry.id), entry);
        return queryClient.invalidateQueries({ queryKey: listsKey(campaignId) });
      },
    });
  }

  function useCreate(campaignId: string) {
    return useChange(campaignId, (input: New) => api.post<T>(path(campaignId), input));
  }

  function useUpdate(campaignId: string, id: string) {
    return useChange(campaignId, (patch: Patch) =>
      api.patch<T>(`${path(campaignId)}/${id}`, patch),
    );
  }

  function useCancel(campaignId: string, id: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => api.delete(`${path(campaignId)}/${id}`),
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: oneKey(campaignId, id) });
        return queryClient.invalidateQueries({ queryKey: listsKey(campaignId) });
      },
    });
  }

  return { useList, useOne, useCreate, useUpdate, useCancel };
}
