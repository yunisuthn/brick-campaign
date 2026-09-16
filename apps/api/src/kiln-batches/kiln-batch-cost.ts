import type { ContractorRates } from '../balances/contractor-balance.js';
import { labourCost, sumKnown } from '../balances/labour.js';
import type { ContractorWorkType } from '../generated/prisma/client.js';

export interface KilnBatchCost {
  /** Live expenses explicitly linked to the batch, in Ariary. */
  expenses: number;
  /** Transport at each entry's own rate, plus kiln loading at the campaign rate, in Ariary; null
   * while a needed rate is not fixed. */
  labour: number | null;
  /** expenses + labour; null with labour. */
  total: number | null;
}

/** A batch just created has nothing linked to it yet. */
export const NO_COST: KilnBatchCost = { expenses: 0, labour: 0, total: 0 };

/**
 * Reference document, section 4: cost of a batch = sum(linked expenses) + sum(transport work x
 * its own rate) + sum(kiln loading work) x campaign rate.
 */
export function kilnBatchCost(
  rates: ContractorRates,
  expenses: ReadonlyArray<{ amount: number }>,
  works: ReadonlyArray<{ type: ContractorWorkType; quantity: number; rate: number | null }>,
): KilnBatchCost {
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const labour = sumKnown(
    works.map((work) =>
      labourCost(work.quantity, work.type === 'transport' ? work.rate : rates.kilnLoadingRate),
    ),
  );
  return {
    expenses: expenseTotal,
    labour,
    total: labour === null ? null : expenseTotal + labour,
  };
}
