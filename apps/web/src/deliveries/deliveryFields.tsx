import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import type { NewDelivery } from './useDeliveries.js';

/** Numbers stay text until submit, so an empty field is empty and not NaN. */
export interface DeliveryForm {
  date: string;
  quantity: string;
  cost: string;
  plate: string;
}

export function toNewDelivery(form: DeliveryForm): NewDelivery {
  return {
    date: form.date,
    quantity: Number(form.quantity),
    cost: Number(form.cost),
    plate: form.plate.trim() === '' ? null : form.plate.trim(),
  };
}

interface DeliveryFieldsProps {
  register: UseFormRegister<DeliveryForm>;
  errors: FieldErrors<DeliveryForm>;
}

/** Shared by the entry and the correction. A trip carries 2 300 to 2 500 bricks, not capped. */
export function DeliveryFields({ register, errors }: DeliveryFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
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
      <Field
        label="Coût du voyage (Ar)"
        error={errors.cost}
        input={register('cost', {
          validate: (value) =>
            /^\d+$/.test(value.trim()) || 'Un montant entier en ariary est attendu, zéro compris.',
        })}
        inputMode="numeric"
      />
      <Field label="Immatriculation (facultatif)" error={errors.plate} input={register('plate')} />
    </>
  );
}
