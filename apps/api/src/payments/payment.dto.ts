import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';

export const paymentTypes = ['vatsy', 'advance', 'settlement'] as const;

const paymentFields = z.object({
  date: dateOnlySchema,
  type: z.enum(paymentTypes),
  /** Ariary paid out. Zero is not a payment. */
  amount: z.int().positive(),
  moulderId: uuidSchema.optional(),
  /** Free text, matched exactly when computing what a contractor is owed. */
  contractorName: z.string().trim().min(1).max(120).optional(),
});

type Beneficiary = Pick<z.infer<typeof paymentFields>, 'moulderId' | 'contractorName'>;

const bothBeneficiaries = (b: Beneficiary) =>
  b.moulderId !== undefined && b.contractorName !== undefined;
const exclusiveMessage = { message: 'moulderId and contractorName are exclusive' };

/** A payment goes to a moulder or to a named contractor, never both, never neither. */
export const createPaymentSchema = paymentFields
  .refine((b) => b.moulderId !== undefined || b.contractorName !== undefined, {
    message: 'moulderId or contractorName is required',
  })
  .refine((b) => !bothBeneficiaries(b), exclusiveMessage);

/**
 * Sending one beneficiary replaces the other. An empty body is a mistake, not a no-op.
 */
export const updatePaymentSchema = paymentFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })
  .refine((b) => !bothBeneficiaries(b), exclusiveMessage);

export const listPaymentsQuerySchema = z.object({
  moulderId: uuidSchema.optional(),
  contractorName: z.string().trim().min(1).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

export interface PaymentDto {
  id: string;
  campaignId: string;
  moulderId: string | null;
  contractorName: string | null;
  type: (typeof paymentTypes)[number];
  date: string;
  amount: number;
}
