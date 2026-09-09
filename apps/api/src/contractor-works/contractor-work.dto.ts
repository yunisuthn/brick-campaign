import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';

export const contractorWorkTypes = ['transport', 'kiln_loading'] as const;

const contractorWorkFields = z.object({
  date: dateOnlySchema,
  kilnBatchId: uuidSchema,
  type: z.enum(contractorWorkTypes),
  /** Free text, matched exactly when computing what the contractor is owed. */
  contractorName: z.string().trim().min(1).max(120),
  /** Bricks carried or loaded. Zero is not an entry. */
  quantity: z.int().positive(),
});

export const createContractorWorkSchema = contractorWorkFields;

/** A correction touches one or more fields; an empty body is a mistake, not a no-op. */
export const updateContractorWorkSchema = contractorWorkFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export const listContractorWorksQuerySchema = z.object({
  kilnBatchId: uuidSchema.optional(),
  contractorName: z.string().trim().min(1).optional(),
  type: z.enum(contractorWorkTypes).optional(),
});

export type CreateContractorWorkDto = z.infer<typeof createContractorWorkSchema>;
export type UpdateContractorWorkDto = z.infer<typeof updateContractorWorkSchema>;
export type ListContractorWorksQuery = z.infer<typeof listContractorWorksQuerySchema>;

export interface ContractorWorkDto {
  id: string;
  campaignId: string;
  kilnBatchId: string;
  type: (typeof contractorWorkTypes)[number];
  contractorName: string;
  date: string;
  quantity: number;
}
