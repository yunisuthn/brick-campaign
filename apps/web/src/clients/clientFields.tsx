import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import type { NewClient } from './useClients.js';

const trimmed = (value: string) => value.trim();

interface ClientFieldsProps {
  register: UseFormRegister<NewClient>;
  errors: FieldErrors<NewClient>;
}

/** Shared by creation and edit. The phone is optional: left empty, it is null. */
export function ClientFields({ register, errors }: ClientFieldsProps) {
  return (
    <>
      <Field
        label="Nom"
        error={errors.name}
        input={register('name', { setValueAs: trimmed, required: 'Le nom est requis.' })}
      />
      <Field
        label="Téléphone"
        error={errors.phone}
        input={register('phone', {
          setValueAs: (value: string | null) => {
            const text = value?.trim() ?? '';
            return text === '' ? null : text;
          },
        })}
        type="tel"
        inputMode="tel"
      />
      <Field
        label="Localité"
        error={errors.locality}
        input={register('locality', {
          setValueAs: trimmed,
          required: 'La localité est requise.',
        })}
      />
    </>
  );
}
