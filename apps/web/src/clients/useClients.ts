import { referenceHooks } from '../api/referenceHooks.js';

/** Mirror of the API's ClientDto. The phone is free text: local numbers come with or without spaces or prefixes. */
export interface Client {
  id: string;
  name: string;
  phone: string | null;
  locality: string;
}

export type NewClient = Omit<Client, 'id'>;
export type ClientPatch = Partial<NewClient>;

const hooks = referenceHooks<Client, NewClient, ClientPatch>('clients', '/clients');

export const useClients = () => hooks.useList();
export const useClient = hooks.useOne;
export const useCreateClient = hooks.useCreate;
export const useUpdateClient = hooks.useUpdate;
