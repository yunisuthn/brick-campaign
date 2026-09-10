import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import type { KilnBatch } from '../kiln-batches/useKilnBatches.js';
import type { RiceField } from '../rice-fields/useRiceFields.js';
import { EXPENSE_CATEGORY_LABELS } from './useExpenses.js';

/** The amount stays text until submit, so an empty field is empty and not NaN. */
export interface ExpenseForm {
  date: string;
  category: string;
  amount: string;
  label: string;
  kilnBatchId: string;
  riceFieldId: string;
}

const CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const NO_LINK = { value: '', label: 'Aucun' };

interface ExpenseFieldsProps {
  register: UseFormRegister<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  batches: ReadonlyArray<Pick<KilnBatch, 'id' | 'loadedOn' | 'quantity'>>;
  riceFields: ReadonlyArray<Pick<RiceField, 'id' | 'name'>>;
}

/**
 * Shared by the entry and the correction. Both links are optional and independent: fuel is
 * often bought before any batch exists, and a rice field contract names no batch at all.
 */
export function ExpenseFields({ register, errors, batches, riceFields }: ExpenseFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <SelectField
        label="Catégorie"
        error={errors.category}
        input={register('category')}
        options={CATEGORY_OPTIONS}
      />
      <Field
        label="Montant (Ar)"
        error={errors.amount}
        input={register('amount', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un montant entier en ariary est attendu.',
        })}
        inputMode="numeric"
      />
      <Field
        label="Libellé"
        error={errors.label}
        input={register('label', {
          setValueAs: (value: string) => value.trim(),
          required: 'Le libellé est requis.',
        })}
      />
      <SelectField
        label="Rizière (facultatif)"
        error={errors.riceFieldId}
        input={register('riceFieldId')}
        options={[NO_LINK, ...riceFields.map((f) => ({ value: f.id, label: f.name }))]}
      />
      <SelectField
        label="Lot (facultatif)"
        error={errors.kilnBatchId}
        input={register('kilnBatchId')}
        options={[
          NO_LINK,
          ...batches.map((b) => ({
            value: b.id,
            label: `Lot du ${b.loadedOn} · ${b.quantity.toLocaleString('fr-FR')} briques`,
          })),
        ]}
      />
    </>
  );
}
