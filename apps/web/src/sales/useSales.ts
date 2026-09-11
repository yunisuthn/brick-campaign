import { campaignEntryHooks } from '../api/campaignEntryHooks.js';

export type SaleStatus = 'ordered' | 'delivered' | 'partially_paid' | 'paid';

/** Derived by the API from the deliveries and the instalments, never stored. */
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  ordered: 'Commandée',
  delivered: 'Livrée',
  partially_paid: 'Partiellement payée',
  paid: 'Payée',
};

/** Mirror of the API's SaleDto; everything below `unitPrice` is derived at read time. */
export interface Sale {
  id: string;
  campaignId: string;
  clientId: string;
  date: string;
  orderedQuantity: number;
  unitPrice: number;
  /** Sum of the live trips. */
  deliveredQuantity: number;
  /** Sum of the live instalments (reference document, section 10.5). */
  receivedAmount: number;
  /** orderedQuantity x unitPrice. */
  total: number;
  /** total - receivedAmount: what this client still owes. */
  outstanding: number;
  status: SaleStatus;
}

export type NewSale = Pick<Sale, 'clientId' | 'date' | 'orderedQuantity' | 'unitPrice'>;
export type SalePatch = Partial<NewSale>;

export const SALES_KEY = ['sales'] as const;
export const salesKey = (campaignId: string) => [...SALES_KEY, campaignId] as const;

const hooks = campaignEntryHooks<Sale, NewSale, SalePatch, Record<string, never>>(
  'sales',
  (campaignId) => `/campaigns/${campaignId}/sales`,
);

/** Newest first, as the API sorts. The list takes no filter. */
export function useSales(campaignId: string) {
  return hooks.useList(campaignId, {});
}

export const useSale = hooks.useOne;
export const useCreateSale = hooks.useCreate;
export const useUpdateSale = hooks.useUpdate;
export const useCancelSale = hooks.useCancel;
