import { campaignEntryHooks } from '../api/campaignEntryHooks.js';

export const contractorWorkTypes = ['transport', 'kiln_loading'] as const;
export type ContractorWorkType = (typeof contractorWorkTypes)[number];

/** Mirror of the API's ContractorWorkDto: always attached to one kiln batch. */
export interface ContractorWork {
  id: string;
  campaignId: string;
  kilnBatchId: string;
  type: ContractorWorkType;
  contractorName: string;
  date: string;
  quantity: number;
  /** The transport price picked for this entry, null for kiln loading or while not yet fixed. */
  rate: number | null;
}

export type NewContractorWork = Pick<
  ContractorWork,
  'kilnBatchId' | 'type' | 'contractorName' | 'date' | 'quantity' | 'rate'
>;
export type ContractorWorkPatch = Partial<NewContractorWork>;

export interface ContractorWorkFilters {
  kilnBatchId?: string;
  contractorName?: string;
  type?: ContractorWorkType;
}

const hooks = campaignEntryHooks<
  ContractorWork,
  NewContractorWork,
  ContractorWorkPatch,
  ContractorWorkFilters
>('contractor-works', (campaignId) => `/campaigns/${campaignId}/contractor-works`);

export function useContractorWorks(campaignId: string, filters: ContractorWorkFilters = {}) {
  return hooks.useList(campaignId, filters);
}

export const useContractorWork = hooks.useOne;
export const useCreateContractorWork = hooks.useCreate;
export const useUpdateContractorWork = hooks.useUpdate;
export const useCancelContractorWork = hooks.useCancel;
