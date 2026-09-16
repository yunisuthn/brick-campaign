import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { salesKey } from '../sales/useSales.js';
import { stockKey } from '../stock/useStock.js';

/** Mirror of the API's DeliveryDto: one trip of the truck for one sale. */
export interface Delivery {
  id: string;
  saleId: string;
  date: string;
  quantity: number;
  /** Fuel plus driver for the trip; zero is allowed, a trip can be paid elsewhere. */
  cost: number;
  plate: string | null;
}

export type NewDelivery = Pick<Delivery, 'date' | 'quantity' | 'cost' | 'plate'>;
export type DeliveryPatch = Partial<NewDelivery>;

/**
 * Deliveries hang under their sale, not under the campaign alone, so they have their own hooks.
 * A trip changes what the sale has delivered, its status, and the fired stock: all three are
 * invalidated with the list.
 */
const KEY = ['deliveries'] as const;
const saleKey = (campaignId: string, saleId: string) => [...KEY, campaignId, saleId] as const;
const listKey = (campaignId: string, saleId: string) =>
  [...saleKey(campaignId, saleId), 'list'] as const;
const oneKey = (campaignId: string, saleId: string, id: string) =>
  [...saleKey(campaignId, saleId), id] as const;

const path = (campaignId: string, saleId: string) =>
  `/campaigns/${campaignId}/sales/${saleId}/deliveries`;

function refresh(queryClient: QueryClient, campaignId: string, saleId: string): Promise<void> {
  const keys = [listKey(campaignId, saleId), salesKey(campaignId), stockKey(campaignId)];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  );
}

export function useDeliveries(campaignId: string, saleId: string) {
  return useQuery({
    queryKey: listKey(campaignId, saleId),
    queryFn: () => api.get<Delivery[]>(path(campaignId, saleId)),
  });
}

export function useDelivery(campaignId: string, saleId: string, id: string) {
  return useQuery({
    queryKey: oneKey(campaignId, saleId, id),
    queryFn: () => api.get<Delivery>(`${path(campaignId, saleId)}/${id}`),
  });
}

function useChange<TInput>(
  campaignId: string,
  saleId: string,
  request: (input: TInput) => Promise<Delivery>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (delivery) => {
      queryClient.setQueryData(oneKey(campaignId, saleId, delivery.id), delivery);
      return refresh(queryClient, campaignId, saleId);
    },
  });
}

export function useCreateDelivery(campaignId: string, saleId: string) {
  return useChange(campaignId, saleId, (input: NewDelivery) =>
    api.post<Delivery>(path(campaignId, saleId), input),
  );
}

export function useUpdateDelivery(campaignId: string, saleId: string, id: string) {
  return useChange(campaignId, saleId, (patch: DeliveryPatch) =>
    api.patch<Delivery>(`${path(campaignId, saleId)}/${id}`, patch),
  );
}

export function useCancelDelivery(campaignId: string, saleId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`${path(campaignId, saleId)}/${id}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: oneKey(campaignId, saleId, id) });
      return refresh(queryClient, campaignId, saleId);
    },
  });
}
