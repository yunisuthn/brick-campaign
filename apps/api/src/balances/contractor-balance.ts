import type { ContractorWorkType, PaymentType } from '../generated/prisma/client.js';
import { labourCost, sumKnown } from './labour.js';
import { type Paid, sumPaid } from './paid.js';

/** Null while the rate is not fixed (reference document, section 3). Kiln loading has one rate
 * per campaign; transport is priced per entry (see `contractorBalance`), so it isn't listed here. */
export interface ContractorRates {
  kilnLoadingRate: number | null;
}

export interface ContractorBalance extends Paid {
  bricksByType: Record<ContractorWorkType, number>;
  /** Transport summed per entry's own rate, kiln loading at the campaign rate; null while a
   * needed rate is not fixed. */
  earned: number | null;
  /** earned - paid; null with earned. */
  due: number | null;
}

/**
 * Reference document, section 4: due to a contractor = sum(transport work x its own rate) +
 * sum(kiln loading work) x campaign rate - sum(payments).
 */
export function contractorBalance(
  rates: ContractorRates,
  works: ReadonlyArray<{ type: ContractorWorkType; quantity: number; rate: number | null }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): ContractorBalance {
  const bricksByType: Record<ContractorWorkType, number> = { transport: 0, kiln_loading: 0 };
  for (const work of works) bricksByType[work.type] += work.quantity;
  const transportEarned = sumKnown(
    works.filter((w) => w.type === 'transport').map((w) => labourCost(w.quantity, w.rate)),
  );
  const kilnLoadingEarned = labourCost(bricksByType.kiln_loading, rates.kilnLoadingRate);
  const earned = sumKnown([transportEarned, kilnLoadingEarned]);
  const { paid, paidByType } = sumPaid(payments);
  return { bricksByType, earned, paid, paidByType, due: earned === null ? null : earned - paid };
}
