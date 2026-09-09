import { z } from 'zod';
import { dateOnlySchema } from '../common/date-only.js';
import { uuidSchema } from '../common/uuid.schema.js';

export const expenseCategories = [
  'rice_field',
  'akofa',
  'tai_charbon',
  'fuel',
  'repair',
  'food',
  'other',
] as const;

const expenseFields = z.object({
  date: dateOnlySchema,
  category: z.enum(expenseCategories),
  /** Integer Ariary. Zero is not an expense. */
  amount: z.int().positive(),
  /** What was bought or paid for: the only thing telling two `other` expenses apart. */
  label: z.string().trim().min(1).max(200),
  /** Free links: nothing forces a fuel expense onto a batch, it is often bought before any exists. */
  kilnBatchId: uuidSchema.nullable(),
  riceFieldId: uuidSchema.nullable(),
});

export const createExpenseSchema = expenseFields.extend({
  kilnBatchId: expenseFields.shape.kilnBatchId.default(null),
  riceFieldId: expenseFields.shape.riceFieldId.default(null),
});

/** No defaults: a field left out is untouched, a link set to null is detached. */
export const updateExpenseSchema = expenseFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' });

export const listExpensesQuerySchema = z.object({
  category: z.enum(expenseCategories).optional(),
  kilnBatchId: uuidSchema.optional(),
  riceFieldId: uuidSchema.optional(),
});

export type ExpenseCategory = (typeof expenseCategories)[number];
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export interface ExpenseDto {
  id: string;
  campaignId: string;
  kilnBatchId: string | null;
  riceFieldId: string | null;
  date: string;
  category: ExpenseCategory;
  amount: number;
  label: string;
}
