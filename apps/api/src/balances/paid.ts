import type { PaymentType } from '../generated/prisma/client.js';

export interface Paid {
  paid: number;
  paidByType: Record<PaymentType, number>;
}

/** Every payment counts against what is owed, whatever its type; the split is for display. */
export function sumPaid(payments: ReadonlyArray<{ type: PaymentType; amount: number }>): Paid {
  const paidByType: Record<PaymentType, number> = { vatsy: 0, advance: 0, settlement: 0 };
  for (const payment of payments) paidByType[payment.type] += payment.amount;
  return { paid: paidByType.vatsy + paidByType.advance + paidByType.settlement, paidByType };
}
