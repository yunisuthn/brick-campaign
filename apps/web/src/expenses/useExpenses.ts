import { campaignEntryHooks } from '../api/campaignEntryHooks.js';

export const expenseCategories = [
  'rice_field',
  'akofa',
  'tai_charbon',
  'fuel',
  'repair',
  'food',
  'other',
] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

/** The categories of the notebook; akofa and tai-charbon are kept as they are said. */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rice_field: 'Rizière',
  akofa: 'Akofa',
  tai_charbon: 'Tai-charbon',
  fuel: 'Carburant',
  repair: 'Réparation',
  food: 'Nourriture',
  other: 'Autre',
};

/** Mirror of the API's ExpenseDto. The two links are free: neither is required. */
export interface Expense {
  id: string;
  campaignId: string;
  kilnBatchId: string | null;
  riceFieldId: string | null;
  date: string;
  category: ExpenseCategory;
  amount: number;
  label: string;
}

export type NewExpense = Pick<
  Expense,
  'date' | 'category' | 'amount' | 'label' | 'kilnBatchId' | 'riceFieldId'
>;
export type ExpensePatch = Partial<NewExpense>;

export interface ExpenseFilters {
  category?: ExpenseCategory;
  kilnBatchId?: string;
  riceFieldId?: string;
}

const hooks = campaignEntryHooks<Expense, NewExpense, ExpensePatch, ExpenseFilters>(
  'expenses',
  (campaignId) => `/campaigns/${campaignId}/expenses`,
);

/** Newest first, as the API sorts. */
export function useExpenses(campaignId: string, filters: ExpenseFilters = {}) {
  return hooks.useList(campaignId, filters);
}

export const useExpense = hooks.useOne;
export const useCreateExpense = hooks.useCreate;
export const useUpdateExpense = hooks.useUpdate;
export const useCancelExpense = hooks.useCancel;
