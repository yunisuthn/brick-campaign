import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';

/** One instalment a client hands over against a sale (reference document, section 10.5). */
const salePaymentFields = z.object({
  date: dateOnlySchema,
  /** In integer Ariary. Zero is not an instalment. */
  amount: z.int().positive(),
});

export const createSalePaymentSchema = salePaymentFields;

/** No defaults: a field left out is left untouched. An empty body is a mistake, not a no-op. */
export const updateSalePaymentSchema = salePaymentFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateSalePaymentDto = z.infer<typeof createSalePaymentSchema>;
export type UpdateSalePaymentDto = z.infer<typeof updateSalePaymentSchema>;

export interface SalePaymentDto {
  id: string;
  saleId: string;
  date: string;
  amount: number;
}
