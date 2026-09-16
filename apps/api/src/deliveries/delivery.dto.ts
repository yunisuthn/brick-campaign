import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';

const deliveryFields = z.object({
  date: dateOnlySchema,
  /** Bricks on the truck. Not capped: a last, half-loaded trip is common. */
  quantity: z.int().positive(),
  /** Fuel plus driver for the trip, in integer Ariary. Zero is allowed: a trip can be paid elsewhere. */
  cost: z.int().nonnegative(),
  /** Registration of the truck, as written on the paperwork; null when nobody noted it. */
  plate: z.string().trim().min(1).max(20).nullable(),
});

export const createDeliverySchema = deliveryFields.extend({
  plate: deliveryFields.shape.plate.default(null),
});

/** No defaults here: a field left out is left untouched. An empty body is a mistake, not a no-op. */
export const updateDeliverySchema = deliveryFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateDeliveryDto = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryDto = z.infer<typeof updateDeliverySchema>;

export interface DeliveryDto {
  id: string;
  saleId: string;
  date: string;
  quantity: number;
  cost: number;
  plate: string | null;
}
