import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';

const productionFields = z.object({
  date: dateOnlySchema,
  moulderId: uuidSchema,
  riceFieldId: uuidSchema,
  /** Bricks moulded that day. Zero is not an entry. */
  quantity: z.int().positive(),
});

export const createProductionSchema = productionFields;

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
  date: string;
  quantity: number;
}
