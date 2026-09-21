import { campaignEntryHooks } from '../api/campaignEntryHooks.js';

export const paymentTypes = ['vatsy', 'advance', 'settlement', 'fee'] as const;
export type PaymentType = (typeof paymentTypes)[number];

/** Mirror of the API's PaymentDto: paid to a moulder or to a named contractor, never both. */
export interface Payment {
  id: string;
  campaignId: string;
  moulderId: string | null;
  contractorName: string | null;
  type: PaymentType;
  date: string;
  amount: number;
}

/** What the API accepts: exactly one of the two beneficiaries is sent. */
export type NewPayment = Pick<Payment, 'type' | 'date' | 'amount'> &
  ({ moulderId: string } | { contractorName: string });

export type PaymentPatch = Partial<Pick<Payment, 'type' | 'date' | 'amount'>> &
  ({ moulderId?: string } | { contractorName?: string });

export interface PaymentFilters {
  moulderId?: string;
  contractorName?: string;
  from?: string;
  to?: string;
}

const hooks = campaignEntryHooks<Payment, NewPayment, PaymentPatch, PaymentFilters>(
  'payments',
  (campaignId) => `/campaigns/${campaignId}/payments`,
);

/** Newest first, as the API sorts. */
export function usePayments(campaignId: string, filters: PaymentFilters = {}) {
  return hooks.useList(campaignId, filters);
}

export const usePayment = hooks.useOne;
export const useCreatePayment = hooks.useCreate;
export const useUpdatePayment = hooks.useUpdate;
export const useCancelPayment = hooks.useCancel;
