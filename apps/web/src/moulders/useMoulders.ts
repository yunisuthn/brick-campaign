import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/** Mirror of the API's MoulderDto: a person or a household, known by the name of the one in charge. */
export interface Moulder {
  id: string;
  name: string;
  memberCount: number;
  active: boolean;
}

export type NewMoulder = Pick<Moulder, 'name' | 'memberCount'>;
export type MoulderPatch = Partial<Omit<Moulder, 'id'>>;

const MOULDERS_KEY = ['moulders'] as const;
const listKey = (includeInactive: boolean) =>
  [...MOULDERS_KEY, 'list', { includeInactive }] as const;
const moulderKey = (id: string) => [...MOULDERS_KEY, id] as const;

/** Active moulders only by default, as the API does: a retired one must not show in day-to-day lists. */
export function useMoulders(includeInactive = false) {
  return useQuery({
    queryKey: listKey(includeInactive),
    queryFn: () => api.get<Moulder[]>(`/moulders?includeInactive=${includeInactive}`),
  });
}

export function useMoulder(id: string) {
  return useQuery({ queryKey: moulderKey(id), queryFn: () => api.get<Moulder>(`/moulders/${id}`) });
}

/** Both lists are stale after any change: a retired moulder leaves one and stays in the other. */
function useMoulderMutation<TInput>(request: (input: TInput) => Promise<Moulder>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (moulder) => {
      queryClient.setQueryData(moulderKey(moulder.id), moulder);
      return queryClient.invalidateQueries({ queryKey: [...MOULDERS_KEY, 'list'] });
    },
  });
}

export function useCreateMoulder() {
  return useMoulderMutation((input: NewMoulder) => api.post<Moulder>('/moulders', input));
}

export function useUpdateMoulder(id: string) {
  return useMoulderMutation((patch: MoulderPatch) => api.patch<Moulder>(`/moulders/${id}`, patch));
}
