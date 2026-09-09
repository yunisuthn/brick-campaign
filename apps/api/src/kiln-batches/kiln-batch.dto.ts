import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';

/** Reference document, section 1: a firing is 40 000 bricks at least. */
export const MIN_KILN_BATCH_QUANTITY = 40_000;

const kilnBatchFields = z.object({
  loadedOn: dateOnlySchema,
  unloadedOn: dateOnlySchema.nullable(),
  quantity: z.int().min(MIN_KILN_BATCH_QUANTITY),
});

/** A batch is created still in the kiln unless an unloading date is given (entered after the fact). */
export const createKilnBatchSchema = kilnBatchFields.extend({
  unloadedOn: kilnBatchFields.shape.unloadedOn.default(null),
});

/** No defaults: a field left out is untouched, `unloadedOn: null` puts the batch back in the kiln. */
export const updateKilnBatchSchema = kilnBatchFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateKilnBatchDto = z.infer<typeof createKilnBatchSchema>;
export type UpdateKilnBatchDto = z.infer<typeof updateKilnBatchSchema>;

export interface KilnBatchDto {
  id: string;
  campaignId: string;
  loadedOn: string;
  unloadedOn: string | null;
  quantity: number;
}
