export type SaleStatus = 'ordered' | 'delivered' | 'paid';

export interface SaleProgress {
  orderedQuantity: number;
  /** Live deliveries of the sale, summed. */
  deliveredQuantity: number;
  paid: boolean;
}

/** Reference document, section 4: revenue is the quantity ordered x unit price, never stored. */
export function saleTotal(orderedQuantity: number, unitPrice: number): number {
  return orderedQuantity * unitPrice;
}

/**
 * Reference document, section 3: ordered, then delivered once the trips cover the order
 * (section 4: sum of deliveries >= ordered quantity, a small surplus happens), then paid.
 * A payment recorded before the last trip still wins: the notebook is the source of truth.
 */
export function saleStatus(sale: SaleProgress): SaleStatus {
  if (sale.paid) return 'paid';
  return sale.deliveredQuantity >= sale.orderedQuantity ? 'delivered' : 'ordered';
}
