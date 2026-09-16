import { z } from 'zod';

export const riceFieldContracts = ['durable', 'seasonal'] as const;

const riceFieldFields = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(200),
  /** Whole square metres; null when the contract does not state a surface. */
  surfaceM2: z.int().positive().nullable(),
  contractType: z.enum(riceFieldContracts),
});

export const createRiceFieldSchema = riceFieldFields.extend({
  surfaceM2: riceFieldFields.shape.surfaceM2.default(null),
});

/** No defaults here: a field left out is left untouched. An empty body is a mistake, not a no-op. */
export const updateRiceFieldSchema = riceFieldFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateRiceFieldDto = z.infer<typeof createRiceFieldSchema>;
export type UpdateRiceFieldDto = z.infer<typeof updateRiceFieldSchema>;

export interface RiceFieldDto {
  id: string;
  name: string;
  location: string;
  surfaceM2: number | null;
  contractType: (typeof riceFieldContracts)[number];
}
