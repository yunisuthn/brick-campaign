import type { PaymentType } from '../generated/prisma/client.js';
import { labourCost, sumKnown } from './labour.js';
import { type Paid, sumPaid } from './paid.js';

export interface MoulderBalance extends Paid {
  /** Bricks moulded over the campaign (cancelled entries excluded upstream). */
  bricks: number;
  /** sum(quantity x rate) per entry, in Ariary; null if any entry's rate is not fixed yet. */
  earned: number | null;
  /** earned - paid. Negative means the moulder was paid more than they produced; null with earned. */
  due: number | null;
}

/**
 * Reference document, section 4: due to a moulder = sum(production quantity x its own rate) -
 * sum(payments). Each entry carries the rate picked when it was recorded, since rice fields
 * worked are not all the same distance away.
 */
export function moulderBalance(
  productions: ReadonlyArray<{ quantity: number; rate: number | null }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): MoulderBalance {
  const bricks = productions.reduce((sum, p) => sum + p.quantity, 0);
  const earned = sumKnown(productions.map((p) => labourCost(p.quantity, p.rate)));
  const { paid, paidByType } = sumPaid(payments);
  return { bricks, earned, paid, paidByType, due: earned === null ? null : earned - paid };
}
