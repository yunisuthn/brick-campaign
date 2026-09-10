import { referenceHooks } from '../api/referenceHooks.js';

export const contractTypes = ['durable', 'seasonal'] as const;
export type ContractType = (typeof contractTypes)[number];

/** Mirror of the API's RiceFieldDto; the contract cost is an expense, not a field here. */
export interface RiceField {
  id: string;
  name: string;
  location: string;
  /** Whole square metres; null when the contract does not state a surface. */
  surfaceM2: number | null;
  contractType: ContractType;
}

export type NewRiceField = Omit<RiceField, 'id'>;
export type RiceFieldPatch = Partial<NewRiceField>;

const hooks = referenceHooks<RiceField, NewRiceField, RiceFieldPatch>(
  'rice-fields',
  '/rice-fields',
);

export const useRiceFields = () => hooks.useList();
export const useRiceField = hooks.useOne;
export const useCreateRiceField = hooks.useCreate;
export const useUpdateRiceField = hooks.useUpdate;
