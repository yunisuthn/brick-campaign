import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { salesKey } from '../sales/useSales.js';

/** Mirror of the API's SalePaymentDto: one instalment handed over against one sale. */
export interface SalePayment {
  id: string;
  saleId: string;
  date: string;
  /** In integer Ariary. */
  amount: number;
}

export type NewSalePayment = Pick<SalePayment, 'date' | 'amount'>;
export type SalePaymentPatch = Partial<NewSalePayment>;

/**
 * Instalments hang under their sale, like the trips do, so they have their own hooks. One of
 * them changes what the sale has received and its status, so the sales are invalidated
 * alongside the list.
 */
const KEY = ['sale-payments'] as const;
const saleKey = (campaignId: string, saleId: string) => [...KEY, campaignId, saleId] as const;
const listKey = (campaignId: string, saleId: string) =>
  [...saleKey(campaignId, saleId), 'list'] as const;
const oneKey = (campaignId: string, saleId: string, id: string) =>
  [...saleKey(campaignId, saleId), id] as const;

const path = (campaignId: string, saleId: string) =>
  `/campaigns/${campaignId}/sales/${saleId}/payments`;

function refresh(queryClient: QueryClient, campaignId: string, saleId: string): Promise<void> {
  const keys = [listKey(campaignId, saleId), salesKey(campaignId)];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  );
}

export function useSalePayments(campaignId: string, saleId: string) {
  return useQuery({
    queryKey: listKey(campaignId, saleId),
    queryFn: () => api.get<SalePayment[]>(path(campaignId, saleId)),
  });
}

export function useSalePayment(campaignId: string, saleId: string, id: string) {
  return useQuery({
    queryKey: oneKey(campaignId, saleId, id),
    queryFn: () => api.get<SalePayment>(`${path(campaignId, saleId)}/${id}`),
  });
}

function useChange<TInput>(
  campaignId: string,
  saleId: string,
  request: (input: TInput) => Promise<SalePayment>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (payment) => {
      queryClient.setQueryData(oneKey(campaignId, saleId, payment.id), payment);
      return refresh(queryClient, campaignId, saleId);
    },
  });
}

export function useCreateSalePayment(campaignId: string, saleId: string) {
  return useChange(campaignId, saleId, (input: NewSalePayment) =>
    api.post<SalePayment>(path(campaignId, saleId), input),
  );
}

export function useUpdateSalePayment(campaignId: string, saleId: string, id: string) {
  return useChange(campaignId, saleId, (patch: SalePaymentPatch) =>
    api.patch<SalePayment>(`${path(campaignId, saleId)}/${id}`, patch),
  );
}

export function useCancelSalePayment(campaignId: string, saleId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`${path(campaignId, saleId)}/${id}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: oneKey(campaignId, saleId, id) });
      return refresh(queryClient, campaignId, saleId);
    },
  });
}
