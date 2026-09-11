import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import type { NewSalePayment } from './useSalePayments.js';

/** The amount stays text until submit, so an empty field is empty and not NaN. */
export interface SalePaymentForm {
  date: string;
  amount: string;
}

export function toNewSalePayment(form: SalePaymentForm): NewSalePayment {
  return { date: form.date, amount: Number(form.amount) };
}

interface SalePaymentFieldsProps {
  register: UseFormRegister<SalePaymentForm>;
  errors: FieldErrors<SalePaymentForm>;
}

/** Shared by the entry and the correction. What is left to pay is shown by the page around it. */
export function SalePaymentFields({ register, errors }: SalePaymentFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <Field
        label="Montant reçu (Ar)"
        error={errors.amount}
        input={register('amount', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un montant entier en ariary est attendu.',
        })}
        inputMode="numeric"
      />
    </>
  );
}
