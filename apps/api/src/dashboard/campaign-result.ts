import { type ContractorRates, contractorBalance } from '../balances/contractor-balance.js';
import { labourCost, sumKnown } from '../balances/labour.js';
import { moulderBalance } from '../balances/moulder-balance.js';
import type { ExpenseCategory } from '../expenses/expense.dto.js';
import type { ContractorWorkType } from '../generated/prisma/client.js';

/** Null while a rate is not fixed (reference document, section 3). */
export interface CampaignRates extends ContractorRates {
  mouldingRate: number | null;
}

/** Live entries of the campaign, or their sums: a grouped row counts like a single entry. */
export interface CampaignEntries {
  sales: ReadonlyArray<{ orderedQuantity: number; unitPrice: number }>;
  /** What clients handed over, instalment by instalment (reference document, section 10.5). */
  salePayments: ReadonlyArray<{ amount: number }>;
  expenses: ReadonlyArray<{ category: ExpenseCategory; amount: number }>;
  productions: ReadonlyArray<{ quantity: number }>;
  contractorWorks: ReadonlyArray<{ type: ContractorWorkType; quantity: number }>;
  /** To moulders and contractors alike: every Ariary that went out for labour. */
  payments: ReadonlyArray<{ amount: number }>;
  deliveries: ReadonlyArray<{ cost: number }>;
}

export interface CampaignResult {
  /** Sum of ordered quantity x unit price, paid or not. */
  revenue: number;
  /** Sum of the amounts actually received. */
  received: number;
  /** revenue - received: what clients still owe. */
  outstanding: number;
  expenses: { total: number; byCategory: Record<ExpenseCategory, number> };
  /**
   * Owed for the bricks, whether paid yet or not (reference document, section 4). Each part is
   * null while its rate is not fixed and there is work to pay for; the total, the outstanding
   * and the result follow.
   */
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
  /** received - expenses - labour owed - delivery costs; null while the labour is unknown. */
  result: number | null;
}

const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'rice_field',
  'akofa',
  'tai_charbon',
  'fuel',
  'repair',
  'food',
  'other',
];

/**
 * Reference document, section 4. The dashboard always tells revenue, received and outstanding
 * apart; the result counts the labour owed, paid or not, so an early advance changes what is
 * left to pay, never the result.
 */
export function campaignResult(rates: CampaignRates, entries: CampaignEntries): CampaignResult {
  const revenue = entries.sales.reduce((sum, s) => sum + s.orderedQuantity * s.unitPrice, 0);
  const received = entries.salePayments.reduce((sum, p) => sum + p.amount, 0);

  const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, 0])) as Record<
    ExpenseCategory,
    number
  >;
  for (const expense of entries.expenses) byCategory[expense.category] += expense.amount;
  const expenseTotal = entries.expenses.reduce((sum, e) => sum + e.amount, 0);

  const moulding = moulderBalance(rates.mouldingRate, entries.productions, []).earned;
  const { bricksByType } = contractorBalance(rates, entries.contractorWorks, []);
  const transport = labourCost(bricksByType.transport, rates.transportRate);
  const kilnLoading = labourCost(bricksByType.kiln_loading, rates.kilnLoadingRate);
  const labourTotal = sumKnown([moulding, transport, kilnLoading]);
  const labourPaid = entries.payments.reduce((sum, p) => sum + p.amount, 0);

  const deliveryCosts = entries.deliveries.reduce((sum, d) => sum + d.cost, 0);

  return {
    revenue,
    received,
    outstanding: revenue - received,
    expenses: { total: expenseTotal, byCategory },
    labour: {
      moulding,
      transport,
      kilnLoading,
      total: labourTotal,
      paid: labourPaid,
      outstanding: labourTotal === null ? null : labourTotal - labourPaid,
    },
    deliveryCosts,
    result: labourTotal === null ? null : received - expenseTotal - labourTotal - deliveryCosts,
  };
}
