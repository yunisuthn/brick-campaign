export type SaleStatus = 'ordered' | 'delivered' | 'partially_paid' | 'paid';

export interface SaleProgress {
  orderedQuantity: number;
  /** Live deliveries of the sale, summed. */
  deliveredQuantity: number;
  /** Live instalments of the sale, summed. */
  receivedAmount: number;
  unitPrice: number;
}

/** Reference document, section 4: revenue is the quantity ordered x unit price, never stored. */
export function saleTotal(orderedQuantity: number, unitPrice: number): number {
  return orderedQuantity * unitPrice;
}

/**
 * Reference document, sections 3 and 10.5: ordered, then delivered once the trips cover the
 * order (sum of deliveries >= ordered quantity, a small surplus happens), partially paid as
 * soon as an instalment arrives, paid once they cover the total.
 *
 * Money comes before bricks in that order on purpose: a client who has paid while a trip is
 * still owed is further along than one who has everything and owes for it, and the notebook is
 * read to know who still owes what.
 */
export function saleStatus(sale: SaleProgress): SaleStatus {
  const total = saleTotal(sale.orderedQuantity, sale.unitPrice);
  if (sale.receivedAmount >= total) return 'paid';
  if (sale.receivedAmount > 0) return 'partially_paid';
  return sale.deliveredQuantity >= sale.orderedQuantity ? 'delivered' : 'ordered';
}
