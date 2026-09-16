import { referenceHooks } from '../api/referenceHooks.js';

/** Mirror of the API's MoulderDto: a person or a household, known by the name of the one in charge. */
export interface Moulder {
  id: string;
  name: string;
  memberCount: number;
  active: boolean;
}

export type NewMoulder = Pick<Moulder, 'name' | 'memberCount'>;
export type MoulderPatch = Partial<Omit<Moulder, 'id'>>;

const hooks = referenceHooks<Moulder, NewMoulder, MoulderPatch>('moulders', '/moulders');

/** Active moulders only by default, as the API does: a retired one must not show in day-to-day lists. */
export function useMoulders(includeInactive = false) {
  return hooks.useList(`?includeInactive=${includeInactive}`);
}

export const useMoulder = hooks.useOne;
export const useCreateMoulder = hooks.useCreate;
export const useUpdateMoulder = hooks.useUpdate;
