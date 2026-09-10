import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import type { NewMoulder } from './useMoulders.js';

/** Plural the French way: one member, two members. */
export function membersText(count: number): string {
  return count === 1 ? '1 membre' : `${count} membres`;
}

interface MoulderFieldsProps {
  register: UseFormRegister<NewMoulder>;
  errors: FieldErrors<NewMoulder>;
}

/** Name of the person in charge and size of the household; shared by creation and edit. */
export function MoulderFields({ register, errors }: MoulderFieldsProps) {
  return (
    <>
      <Field
        label="Nom du responsable"
        error={errors.name}
        input={register('name', {
          setValueAs: (value: string) => value.trim(),
          required: 'Le nom est requis.',
        })}
      />
      <Field
        label="Nombre de membres"
        error={errors.memberCount}
        input={register('memberCount', {
          valueAsNumber: true,
          validate: (value) =>
            (Number.isInteger(value) && value >= 1 && value <= 20) ||
            'Un nombre entre 1 et 20 est attendu.',
        })}
        inputMode="numeric"
      />
    </>
  );
}
