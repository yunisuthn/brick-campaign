import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import type { PaymentType } from '../payments/usePayments.js';

/** Every payment counts against what is owed, whatever its type; the split is for display. */
export type PaidByType = Record<PaymentType, number>;

interface Balance {
  paid: number;
  paidByType: PaidByType;
  /** Null while the campaign rate it needs is not fixed (reference document, section 4). */
  earned: number | null;
  /** earned - paid; null with earned. */
  due: number | null;
}

export interface MoulderBalance extends Balance {
  moulderId: string;
  name: string;
  bricks: number;
}

export interface ContractorBalance extends Balance {
  contractorName: string;
  bricksByType: { transport: number; kiln_loading: number };
}

const KEY = ['balances'] as const;

/** One line per moulder with at least one entry in the campaign, by name. */
export function useMoulderBalances(campaignId: string) {
  return useQuery({
    queryKey: [...KEY, campaignId, 'moulders'] as const,
    queryFn: () => api.get<MoulderBalance[]>(`/campaigns/${campaignId}/balances/moulders`),
  });
}

/** One line per contractor name seen in a work or a payment of the campaign. */
export function useContractorBalances(campaignId: string) {
  return useQuery({
    queryKey: [...KEY, campaignId, 'contractors'] as const,
    queryFn: () => api.get<ContractorBalance[]>(`/campaigns/${campaignId}/balances/contractors`),
  });
}
