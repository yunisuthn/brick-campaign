import type { ContractorWorkType, PaymentType } from '../generated/prisma/client.js';
import { labourCost, sumKnown } from './labour.js';
import { type Paid, sumPaid } from './paid.js';

/** Null while a rate is not fixed (reference document, section 3). */
export interface ContractorRates {
  transportRate: number | null;
  kilnLoadingRate: number | null;
}

export interface ContractorBalance extends Paid {
  bricksByType: Record<ContractorWorkType, number>;
  /** Each type at its own campaign rate, in Ariary; null while a needed rate is not fixed. */
  earned: number | null;
  /** earned - paid; null with earned. */
  due: number | null;
}

/** Reference document, section 4: due to a contractor = sum(work) x rate of the type - sum(payments). */
export function contractorBalance(
  rates: ContractorRates,
  works: ReadonlyArray<{ type: ContractorWorkType; quantity: number }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): ContractorBalance {
  const bricksByType: Record<ContractorWorkType, number> = { transport: 0, kiln_loading: 0 };
  for (const work of works) bricksByType[work.type] += work.quantity;
  const earned = sumKnown([
    labourCost(bricksByType.transport, rates.transportRate),
    labourCost(bricksByType.kiln_loading, rates.kilnLoadingRate),
  ]);
  const { paid, paidByType } = sumPaid(payments);
  return { bricksByType, earned, paid, paidByType, due: earned === null ? null : earned - paid };
}
