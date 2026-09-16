import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';

const productionFields = z.object({
  startedOn: dateOnlySchema,
  /** Null while the work is not finished yet. */
  endedOn: dateOnlySchema.nullable(),
  moulderId: uuidSchema,
  riceFieldId: uuidSchema,
  /** Bricks moulded. Zero is not an entry. */
  quantity: z.int().positive(),
  /** One of the campaign's moulding rates, or null while not yet fixed. */
  rate: z.int().nonnegative().nullable(),
});

/** A production is entered still in progress unless an end date is given (past work entered
 * after the fact). */
export const createProductionSchema = productionFields.extend({
  endedOn: productionFields.shape.endedOn.default(null),
  rate: productionFields.shape.rate.default(null),
});

/** A correction touches one or more fields; an empty body is a mistake, not a no-op. */
export const updateProductionSchema = productionFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export const listProductionsQuerySchema = z.object({
  moulderId: uuidSchema.optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export type CreateProductionDto = z.infer<typeof createProductionSchema>;
export type UpdateProductionDto = z.infer<typeof updateProductionSchema>;
export type ListProductionsQuery = z.infer<typeof listProductionsQuerySchema>;

export interface ProductionDto {
  id: string;
  campaignId: string;
  moulderId: string;
  riceFieldId: string;
  startedOn: string;
  endedOn: string | null;
  quantity: number;
  rate: number | null;
}
