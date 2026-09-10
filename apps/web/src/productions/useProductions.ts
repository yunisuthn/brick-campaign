import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/** Mirror of the API's ProductionDto: one day of one moulder on one rice field, no amount. */
export interface Production {
  id: string;
  campaignId: string;
  moulderId: string;
  riceFieldId: string;
  date: string;
  quantity: number;
}

export type NewProduction = Pick<Production, 'moulderId' | 'riceFieldId' | 'date' | 'quantity'>;
export type ProductionPatch = Partial<NewProduction>;

/** The filters the API offers on the list. */
export interface ProductionFilters {
  moulderId?: string;
  from?: string;
  to?: string;
}

const KEY = ['productions'] as const;
const campaignKey = (campaignId: string) => [...KEY, campaignId] as const;
const listKey = (campaignId: string, filters: ProductionFilters) =>
  [...campaignKey(campaignId), 'list', filters] as const;
const oneKey = (campaignId: string, id: string) => [...campaignKey(campaignId), id] as const;

const basePath = (campaignId: string) => `/campaigns/${campaignId}/productions`;

function search(filters: ProductionFilters): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) if (value) params.set(name, value);
  const text = params.toString();
  return text === '' ? '' : `?${text}`;
}

/** Newest first, as the API sorts. */
export function useProductions(campaignId: string, filters: ProductionFilters = {}) {
  return useQuery({
    queryKey: listKey(campaignId, filters),
    queryFn: () => api.get<Production[]>(`${basePath(campaignId)}${search(filters)}`),
  });
}

export function useProduction(campaignId: string, id: string) {
  return useQuery({
    queryKey: oneKey(campaignId, id),
    queryFn: () => api.get<Production>(`${basePath(campaignId)}/${id}`),
  });
}

/** Any change leaves every list of the campaign stale, filtered or not. */
function useProductionChange<TInput>(
  campaignId: string,
  request: (input: TInput) => Promise<Production>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (production) => {
      queryClient.setQueryData(oneKey(campaignId, production.id), production);
      return queryClient.invalidateQueries({ queryKey: [...campaignKey(campaignId), 'list'] });
    },
  });
}

export function useCreateProduction(campaignId: string) {
  return useProductionChange(campaignId, (input: NewProduction) =>
    api.post<Production>(basePath(campaignId), input),
  );
}

export function useUpdateProduction(campaignId: string, id: string) {
  return useProductionChange(campaignId, (patch: ProductionPatch) =>
    api.patch<Production>(`${basePath(campaignId)}/${id}`, patch),
  );
}

/** A cancelled entry is gone from the API: its detail is dropped, not refreshed. */
export function useCancelProduction(campaignId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`${basePath(campaignId)}/${id}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: oneKey(campaignId, id) });
      return queryClient.invalidateQueries({ queryKey: [...campaignKey(campaignId), 'list'] });
    },
  });
}
