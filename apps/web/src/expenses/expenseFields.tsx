import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField, NumberField, SelectField, TextField } from '@/components/fields';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import type { KilnBatch } from '../kiln-batches/useKilnBatches.js';
import type { RiceField } from '../rice-fields/useRiceFields.js';
import { EXPENSE_CATEGORY_KEY, expenseCategories } from './useExpenses.js';

/** The amount stays text until submit, so an empty field is empty and not NaN. */
export interface ExpenseForm {
  date: string;
  category: string;
  amount: string;
  label: string;
  kilnBatchId: string;
  riceFieldId: string;
}

interface ExpenseFieldsProps {
  register: UseFormRegister<ExpenseForm>;
  control: Control<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  batches: ReadonlyArray<Pick<KilnBatch, 'id' | 'loadedOn' | 'quantity'>>;
  riceFields: ReadonlyArray<Pick<RiceField, 'id' | 'name'>>;
}

/**
 * Shared by the entry and the correction. Both links are optional and independent: fuel is
 * often bought before any batch exists, and a rice field contract names no batch at all.
 */
export function ExpenseFields({
  register,
  control,
  errors,
  batches,
  riceFields,
}: ExpenseFieldsProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const categoryOptions = expenseCategories.map((value) => ({
    value,
    label: t(EXPENSE_CATEGORY_KEY[value]),
  }));
  const noLink = { value: '', label: t('expenses.noneOption') };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t('common.date')}
          name="date"
          control={control}
          error={errors.date}
          required={t('common.dateRequired')}
        />
        <SelectField
          label={t('expenses.categoryLabel')}
          name="category"
          control={control}
          error={errors.category}
          options={categoryOptions}
        />
      </div>
      <NumberField
        label={t('expenses.amountLabel')}
        error={errors.amount}
        registration={register('amount', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('common.amountRequiredInteger'),
        })}
      />
      <TextField
        label={t('expenses.labelLabel')}
        error={errors.label}
        registration={register('label', {
          setValueAs: (value: string) => value.trim(),
          required: t('expenses.labelRequired'),
        })}
      />
      <SelectField
        label={t('expenses.riceFieldLabel')}
        name="riceFieldId"
        control={control}
        error={errors.riceFieldId}
        options={[noLink, ...riceFields.map((f) => ({ value: f.id, label: f.name }))]}
      />
      <SelectField
        label={t('expenses.kilnBatchLabel')}
        name="kilnBatchId"
        control={control}
        error={errors.kilnBatchId}
        options={[
          noLink,
          ...batches.map((b) => ({
            value: b.id,
            label: t('expenses.kilnBatchOption', {
              date: format.date(b.loadedOn),
              quantity: format.count(b.quantity),
            }),
          })),
        ]}
      />
    </>
  );
}
