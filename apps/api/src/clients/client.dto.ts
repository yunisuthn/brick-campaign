import { z } from 'zod';

const clientFields = z.object({
  name: z.string().trim().min(1).max(120),
  /** Free text: local numbers are written with or without spaces, prefixes or dashes. */
  phone: z.string().trim().min(1).max(40).nullable(),
  locality: z.string().trim().min(1).max(200),
});

export const createClientSchema = clientFields.extend({
  phone: clientFields.shape.phone.default(null),
});

/** No defaults here: a field left out is left untouched. An empty body is a mistake, not a no-op. */
export const updateClientSchema = clientFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;

export interface ClientDto {
  id: string;
  name: string;
  phone: string | null;
  locality: string;
}
