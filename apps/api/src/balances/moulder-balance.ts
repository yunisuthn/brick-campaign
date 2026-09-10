import type { PaymentType } from '../generated/prisma/client.js';
import { labourCost } from './labour.js';
import { type Paid, sumPaid } from './paid.js';

export interface MoulderBalance extends Paid {
  /** Bricks moulded over the campaign (cancelled entries excluded upstream). */
  bricks: number;
  /** bricks x campaign moulding rate, in Ariary; null while the rate is not fixed and bricks > 0. */
  earned: number | null;
  /** earned - paid. Negative means the moulder was paid more than they produced; null with earned. */
  due: number | null;
}

/** Reference document, section 4: due to a moulder = sum(production) x moulding rate - sum(payments). */
export function moulderBalance(
  mouldingRate: number | null,
  productions: ReadonlyArray<{ quantity: number }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): MoulderBalance {
  const bricks = productions.reduce((sum, p) => sum + p.quantity, 0);
  const earned = labourCost(bricks, mouldingRate);
  const { paid, paidByType } = sumPaid(payments);
  return { bricks, earned, paid, paidByType, due: earned === null ? null : earned - paid };
}
