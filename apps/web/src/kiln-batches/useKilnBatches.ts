import { campaignEntryHooks } from '../api/campaignEntryHooks.js';

/** Reference document, section 1: a firing is 40 000 bricks at least. */
export const MIN_KILN_BATCH_QUANTITY = 40_000;

/** Derived at read time; labour and total are null while a rate the batch needs is not fixed. */
export interface KilnBatchCost {
  expenses: number;
  labour: number | null;
  total: number | null;
}

/** Mirror of the API's KilnBatchDto. Still in the kiln while `unloadedOn` is null. */
export interface KilnBatch {
  id: string;
  campaignId: string;
  loadedOn: string;
  unloadedOn: string | null;
  quantity: number;
  cost: KilnBatchCost;
}

export type NewKilnBatch = Pick<KilnBatch, 'loadedOn' | 'unloadedOn' | 'quantity'>;
export type KilnBatchPatch = Partial<NewKilnBatch>;

const hooks = campaignEntryHooks<KilnBatch, NewKilnBatch, KilnBatchPatch, Record<string, never>>(
  'kiln-batches',
  (campaignId) => `/campaigns/${campaignId}/kiln-batches`,
);

/** Newest first, as the API sorts. The list takes no filter. */
export function useKilnBatches(campaignId: string) {
  return hooks.useList(campaignId, {});
}

export const useKilnBatch = hooks.useOne;
export const useCreateKilnBatch = hooks.useCreate;
export const useUpdateKilnBatch = hooks.useUpdate;
export const useCancelKilnBatch = hooks.useCancel;
