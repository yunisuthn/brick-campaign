import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import type { Moulder } from '../moulders/useMoulders.js';
import type { RiceField } from '../rice-fields/useRiceFields.js';
import type { NewProduction } from './useProductions.js';

/**
 * What the form holds: the quantity stays text until submit, so an empty field is empty and
 * not NaN, and the two ids are '' until chosen.
 */
export interface ProductionForm {
  date: string;
  moulderId: string;
  riceFieldId: string;
  quantity: string;
}

export function toNewProduction(form: ProductionForm): NewProduction {
  return { ...form, quantity: Number(form.quantity) };
}

const CHOOSE = { value: '', label: 'Choisir…' };

interface ProductionFieldsProps {
  register: UseFormRegister<ProductionForm>;
  errors: FieldErrors<ProductionForm>;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  riceFields: ReadonlyArray<Pick<RiceField, 'id' | 'name'>>;
}

/** Shared by the day's entry and the correction; the lists to choose from come from the page. */
export function ProductionFields({
  register,
  errors,
  moulders,
  riceFields,
}: ProductionFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <SelectField
        label="Mouleur"
        error={errors.moulderId}
        input={register('moulderId', { required: 'Le mouleur est requis.' })}
        options={[CHOOSE, ...moulders.map((m) => ({ value: m.id, label: m.name }))]}
      />
      <SelectField
        label="Rizière"
        error={errors.riceFieldId}
        input={register('riceFieldId', { required: 'La rizière est requise.' })}
        options={[CHOOSE, ...riceFields.map((f) => ({ value: f.id, label: f.name }))]}
      />
      <Field
        label="Quantité (briques)"
        error={errors.quantity}
        input={register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un nombre entier de briques est attendu.',
        })}
        inputMode="numeric"
      />
    </>
  );
}
