import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import { WORK_TYPE_LABELS } from './useContractorWorks.js';

/** The quantity stays text until submit, so an empty field is empty and not NaN; the rate is ''
 * while not yet fixed, and only means anything for a transport entry. */
export interface ContractorWorkForm {
  date: string;
  type: string;
  contractorName: string;
  quantity: string;
  rate: string;
}

const TYPE_OPTIONS = Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const RATE_TO_FIX = { value: '', label: 'À fixer' };

interface ContractorWorkFieldsProps {
  register: UseFormRegister<ContractorWorkForm>;
  errors: FieldErrors<ContractorWorkForm>;
  /** Contractor names already seen in the campaign, offered as suggestions. */
  contractorNames: ReadonlyArray<string>;
  /** The currently chosen type, to show the rate picker only for transport. */
  type: string;
  /** The campaign's transport prices to pick from; empty while none is fixed yet. */
  rates: ReadonlyArray<number>;
}

/** Shared by the entry and the correction. The batch a work belongs to comes from the URL. */
export function ContractorWorkFields({
  register,
  errors,
  contractorNames,
  type,
  rates,
}: ContractorWorkFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <SelectField
        label="Type de prestation"
        error={errors.type}
        input={register('type')}
        options={TYPE_OPTIONS}
      />
      <Field
        label="Nom du prestataire"
        error={errors.contractorName}
        input={register('contractorName', {
          setValueAs: (value: string) => value.trim(),
          required: 'Le nom du prestataire est requis.',
        })}
        suggestions={contractorNames}
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
      {type === 'transport' && (
        <SelectField
          label="Tarif de transport"
          error={errors.rate}
          input={register('rate')}
          options={[
            RATE_TO_FIX,
            ...rates.map((rate) => ({ value: String(rate), label: `${rate} Ar la brique` })),
          ]}
        />
      )}
    </>
  );
}
