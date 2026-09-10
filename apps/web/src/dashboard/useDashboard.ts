import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import type { ExpenseCategory } from '../expenses/useExpenses.js';
import type { Stock } from '../stock/useStock.js';

/**
 * Mirror of the API's DashboardDto. Every figure is derived from the live entries at read
 * time; the labour parts and the result are null while a rate they need is not fixed.
 */
export interface Dashboard {
  campaignId: string;
  stock: Stock;
  /** Ordered quantity x unit price, paid or not. */
  revenue: number;
  received: number;
  /** revenue - received: what clients still owe. */
  outstanding: number;
  expenses: { total: number; byCategory: Record<ExpenseCategory, number> };
  labour: {
    moulding: number | null;
    transport: number | null;
    kilnLoading: number | null;
    total: number | null;
    paid: number;
    /** total - paid: what is still due to moulders and contractors. */
    outstanding: number | null;
  };
  deliveryCosts: number;
  /** received - expenses - labour owed - delivery costs. */
  result: number | null;
}

export function useDashboard(campaignId: string) {
  return useQuery({
    queryKey: ['dashboard', campaignId] as const,
    queryFn: () => api.get<Dashboard>(`/campaigns/${campaignId}/dashboard`),
  });
}
