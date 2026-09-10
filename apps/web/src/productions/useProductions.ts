import { campaignEntryHooks } from '../api/campaignEntryHooks.js';
import { stockKey } from '../stock/useStock.js';

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

const hooks = campaignEntryHooks<Production, NewProduction, ProductionPatch, ProductionFilters>(
  'productions',
  (campaignId) => `/campaigns/${campaignId}/productions`,
  // Moulded bricks are the raw stock.
  { affects: (campaignId) => [stockKey(campaignId)] },
);

/** Newest first, as the API sorts. */
export function useProductions(campaignId: string, filters: ProductionFilters = {}) {
  return hooks.useList(campaignId, filters);
}

export const useProduction = hooks.useOne;
export const useCreateProduction = hooks.useCreate;
export const useUpdateProduction = hooks.useUpdate;
export const useCancelProduction = hooks.useCancel;
