import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import type { Moulder } from '../moulders/useMoulders.js';
import type { RiceField } from '../rice-fields/useRiceFields.js';
import type { NewProduction } from './useProductions.js';

/**
 * What the form holds: the quantity stays text until submit, so an empty field is empty and
 * not NaN, the two ids are '' until chosen, and the rate is '' while not yet fixed. `endedOn` is
 * '' while the work is not finished, and only shown once it can be (see `showEndedOn`).
 */
export interface ProductionForm {
  startedOn: string;
  endedOn: string;
  moulderId: string;
  riceFieldId: string;
  quantity: string;
  rate: string;
}

export function toNewProduction(form: ProductionForm): NewProduction {
  return {
    ...form,
    endedOn: form.endedOn === '' ? null : form.endedOn,
    quantity: Number(form.quantity),
    rate: form.rate === '' ? null : Number(form.rate),
  };
}

const CHOOSE = { value: '', label: 'Choisir…' };
const RATE_TO_FIX = { value: '', label: 'À fixer' };

interface ProductionFieldsProps {
  register: UseFormRegister<ProductionForm>;
  errors: FieldErrors<ProductionForm>;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  riceFields: ReadonlyArray<Pick<RiceField, 'id' | 'name'>>;
  /** The campaign's moulding prices to pick from; empty while none is fixed yet. */
  rates: ReadonlyArray<number>;
  /** A new entry starts still in progress; the end date is a correction, set once known. */
  showEndedOn?: boolean;
}

/** Shared by the entry and the correction; the lists to choose from come from the page. */
export function ProductionFields({
  register,
  errors,
  moulders,
  riceFields,
  rates,
  showEndedOn = false,
}: ProductionFieldsProps) {
  return (
    <>
      <Field
        label="Date de début"
        error={errors.startedOn}
        input={register('startedOn', { required: 'La date de début est requise.' })}
        type="date"
      />
      {showEndedOn && (
        <>
          <Field
            label="Date de fin"
            error={errors.endedOn}
            input={register('endedOn')}
            type="date"
          />
          <p className="sub">Laissée vide tant que le travail n’est pas terminé.</p>
        </>
      )}
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
      <SelectField
        label="Tarif de moulage"
        error={errors.rate}
        input={register('rate')}
        options={[
          RATE_TO_FIX,
          ...rates.map((rate) => ({ value: String(rate), label: `${rate} Ar la brique` })),
        ]}
      />
    </>
  );
}
