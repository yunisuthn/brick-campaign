import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';
import type { SaleStatus } from './sale.rules.js';

/**
 * The client pays once, when everything is delivered (no partial payment in the v1), so the
 * payment is one object: both fields together, or nothing. Amount in integer Ariary.
 */
const salePaymentSchema = z.object({
  paidOn: dateOnlySchema,
  amountReceived: z.int().positive(),
});

const saleFields = z.object({
  clientId: uuidSchema,
  date: dateOnlySchema,
  orderedQuantity: z.int().positive(),
  /** Negotiated per sale according to the going rate, in integer Ariary per brick. */
  unitPrice: z.int().positive(),
  payment: salePaymentSchema.nullable(),
});

/** A sale is created unpaid unless the payment is given (entered after the fact). */
export const createSaleSchema = saleFields.extend({
  payment: saleFields.shape.payment.default(null),
});

/** No defaults: a field left out is untouched, `payment: null` takes a payment back. */
export const updateSaleSchema = saleFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type SalePaymentDto = z.infer<typeof salePaymentSchema>;
export type CreateSaleDto = z.infer<typeof createSaleSchema>;
export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;

/** Stored fields plus what is derived at read time: nothing below `payment` is in the table. */
export interface SaleDto {
  id: string;
  campaignId: string;
  clientId: string;
  date: string;
  orderedQuantity: number;
  unitPrice: number;
  payment: SalePaymentDto | null;
  /** Sum of the live deliveries. */
  deliveredQuantity: number;
  /** orderedQuantity x unitPrice: the revenue of the sale. */
  total: number;
  status: SaleStatus;
}
