import { z } from 'zod';

const moulderFields = z.object({
  /** Name of the person in charge; households are known by that name. Not unique: homonyms exist. */
  name: z.string().trim().min(1).max(120),
  memberCount: z.int().min(1).max(20),
  active: z.boolean(),
});

export const createMoulderSchema = moulderFields.omit({ active: true }).extend({
  memberCount: moulderFields.shape.memberCount.default(1),
});

/** `active: false` is the only way to retire a moulder; an empty body is a mistake, not a no-op. */
export const updateMoulderSchema = moulderFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

/** Query string values arrive as text; `stringbool` reads true/false/1/0/yes/no. */
export const listMouldersQuerySchema = z.object({
  includeInactive: z.stringbool().default(false),
});

export type CreateMoulderDto = z.infer<typeof createMoulderSchema>;
export type UpdateMoulderDto = z.infer<typeof updateMoulderSchema>;
export type ListMouldersQuery = z.infer<typeof listMouldersQuerySchema>;

export interface MoulderDto {
  id: string;
  name: string;
  memberCount: number;
  active: boolean;
}
