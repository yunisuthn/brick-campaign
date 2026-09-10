import type { ContractorRates } from '../balances/contractor-balance.js';
import { labourCost, sumKnown } from '../balances/labour.js';
import type { ContractorWorkType } from '../generated/prisma/client.js';

export interface KilnBatchCost {
  /** Live expenses explicitly linked to the batch, in Ariary. */
  expenses: number;
  /** Transport and kiln loading of the batch, each type at its campaign rate, in Ariary; null while a needed rate is not fixed. */
  labour: number | null;
  /** expenses + labour; null with labour. */
  total: number | null;
}

/** A batch just created has nothing linked to it yet. */
export const NO_COST: KilnBatchCost = { expenses: 0, labour: 0, total: 0 };

/** Reference document, section 4: cost of a batch = sum(linked expenses) + sum(works of the batch) x rate of the type. */
export function kilnBatchCost(
  rates: ContractorRates,
  expenses: ReadonlyArray<{ amount: number }>,
  works: ReadonlyArray<{ type: ContractorWorkType; quantity: number }>,
): KilnBatchCost {
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const rateOf: Record<ContractorWorkType, number | null> = {
    transport: rates.transportRate,
    kiln_loading: rates.kilnLoadingRate,
  };
  const labour = sumKnown(works.map((work) => labourCost(work.quantity, rateOf[work.type])));
  return {
    expenses: expenseTotal,
    labour,
    total: labour === null ? null : expenseTotal + labour,
  };
}
