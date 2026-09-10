import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import type { ContractType, NewRiceField } from './useRiceFields.js';

/** The words of the notebook: a lasting contract, or one for the season. */
export const CONTRACT_LABELS: Record<ContractType, string> = {
  durable: 'Durable',
  seasonal: 'De campagne',
};

export function surfaceText(surfaceM2: number | null): string {
  return surfaceM2 === null ? 'Surface non précisée' : `${surfaceM2} m²`;
}

interface RiceFieldFieldsProps {
  register: UseFormRegister<NewRiceField>;
  errors: FieldErrors<NewRiceField>;
}

/** Shared by creation and edit. The surface is optional: left empty, it is null. */
export function RiceFieldFields({ register, errors }: RiceFieldFieldsProps) {
  return (
    <>
      <Field
        label="Nom"
        error={errors.name}
        input={register('name', {
          setValueAs: (value: string) => value.trim(),
          required: 'Le nom est requis.',
        })}
      />
      <Field
        label="Localisation"
        error={errors.location}
        input={register('location', {
          setValueAs: (value: string) => value.trim(),
          required: 'La localisation est requise.',
        })}
      />
      <Field
        label="Surface (m²)"
        error={errors.surfaceM2}
        input={register('surfaceM2', {
          setValueAs: (value: unknown) => (value === '' || value === null ? null : Number(value)),
          validate: (value) =>
            value === null ||
            (Number.isInteger(value) && value > 0) ||
            'Un nombre entier de mètres carrés est attendu, ou rien.',
        })}
        inputMode="numeric"
      />
      <SelectField
        label="Type de contrat"
        error={errors.contractType}
        input={register('contractType')}
        options={Object.entries(CONTRACT_LABELS).map(([value, label]) => ({ value, label }))}
      />
    </>
  );
}
