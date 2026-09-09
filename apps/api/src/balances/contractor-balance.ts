import type { ContractorWorkType, PaymentType } from '../generated/prisma/client.js';
import { type Paid, sumPaid } from './paid.js';

export interface ContractorRates {
  transportRate: number;
  kilnLoadingRate: number;
}

export interface ContractorBalance extends Paid {
  bricksByType: Record<ContractorWorkType, number>;
  /** Each type at its own campaign rate, in Ariary. */
  earned: number;
  /** earned - paid. */
  due: number;
}

/** Reference document, section 4: due to a contractor = sum(work) x rate of the type - sum(payments). */
export function contractorBalance(
  rates: ContractorRates,
  works: ReadonlyArray<{ type: ContractorWorkType; quantity: number }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): ContractorBalance {
  const bricksByType: Record<ContractorWorkType, number> = { transport: 0, kiln_loading: 0 };
  for (const work of works) bricksByType[work.type] += work.quantity;
  const earned =
    bricksByType.transport * rates.transportRate +
    bricksByType.kiln_loading * rates.kilnLoadingRate;
  const { paid, paidByType } = sumPaid(payments);
  return { bricksByType, earned, paid, paidByType, due: earned - paid };
}
