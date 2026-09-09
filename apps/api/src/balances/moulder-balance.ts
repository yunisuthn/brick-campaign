import type { PaymentType } from '../generated/prisma/client.js';

export interface MoulderBalance {
  /** Bricks moulded over the campaign (cancelled entries excluded upstream). */
  bricks: number;
  /** bricks x campaign moulding rate, in Ariary. */
  earned: number;
  paid: number;
  paidByType: Record<PaymentType, number>;
  /** earned - paid. Negative means the moulder was paid more than they produced. */
  due: number;
}

/** Reference document, section 4: due to a moulder = sum(production) x moulding rate - sum(payments). */
export function moulderBalance(
  mouldingRate: number,
  productions: ReadonlyArray<{ quantity: number }>,
  payments: ReadonlyArray<{ type: PaymentType; amount: number }>,
): MoulderBalance {
  const bricks = productions.reduce((sum, p) => sum + p.quantity, 0);
  const paidByType: Record<PaymentType, number> = { vatsy: 0, advance: 0, settlement: 0 };
  for (const payment of payments) paidByType[payment.type] += payment.amount;
  const earned = bricks * mouldingRate;
  const paid = paidByType.vatsy + paidByType.advance + paidByType.settlement;
  return { bricks, earned, paid, paidByType, due: earned - paid };
}
