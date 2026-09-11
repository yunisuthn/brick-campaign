import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';
import type { SaleStatus } from './sale.rules.js';

/**
 * What the client owes. What has come in is not here: a sale is paid in instalments (reference
 * document, section 10.5), each one a row of its own under `.../sales/:id/payments`.
 */
const saleFields = z.object({
  clientId: uuidSchema,
  date: dateOnlySchema,
  orderedQuantity: z.int().positive(),
  /** Negotiated per sale according to the going rate, in integer Ariary per brick. */
  unitPrice: z.int().positive(),
});

export const createSaleSchema = saleFields;

/** No defaults: a field left out is untouched. An empty body is a mistake, not a no-op. */
export const updateSaleSchema = saleFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;

/** Stored fields plus what is derived at read time: nothing below `unitPrice` is in the table. */
export interface SaleDto {
  id: string;
  campaignId: string;
  clientId: string;
  date: string;
  orderedQuantity: number;
  unitPrice: number;
  /** Sum of the live deliveries. */
  deliveredQuantity: number;
  /** Sum of the live instalments. */
  receivedAmount: number;
  /** orderedQuantity x unitPrice: the revenue of the sale. */
  total: number;
  /** total - receivedAmount: what this client still owes. Never below zero. */
  outstanding: number;
  status: SaleStatus;
}
