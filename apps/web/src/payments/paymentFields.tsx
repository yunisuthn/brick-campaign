import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import type { Moulder } from '../moulders/useMoulders.js';
import { type NewPayment, PAYMENT_TYPE_LABELS, type PaymentType } from './usePayments.js';

/**
 * What the form holds. The API takes a moulder or a contractor name and refuses both, so the
 * form keeps the two apart and only sends the one the kind names; the amount stays text until
 * submit, so an empty field is empty and not NaN.
 */
export interface PaymentForm {
  date: string;
  kind: 'moulder' | 'contractor';
  moulderId: string;
  contractorName: string;
  type: PaymentType;
  amount: string;
}

export function toNewPayment(form: PaymentForm): NewPayment {
  const common = { date: form.date, type: form.type, amount: Number(form.amount) };
  return form.kind === 'moulder'
    ? { ...common, moulderId: form.moulderId }
    : { ...common, contractorName: form.contractorName.trim() };
}

const KIND_OPTIONS = [
  { value: 'moulder', label: 'Mouleur' },
  { value: 'contractor', label: 'Prestataire' },
];

const TYPE_OPTIONS = Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface PaymentFieldsProps {
  register: UseFormRegister<PaymentForm>;
  watch: UseFormWatch<PaymentForm>;
  errors: FieldErrors<PaymentForm>;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  /** Contractor names already seen in the campaign, offered as suggestions. */
  contractorNames: ReadonlyArray<string>;
}

/** Shared by the entry and the correction; the lists to choose from come from the page. */
export function PaymentFields({
  register,
  watch,
  errors,
  moulders,
  contractorNames,
}: PaymentFieldsProps) {
  const kind = watch('kind');

  return (
    <>
      <Field
        label="Date"
        error={errors.date}
        input={register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <SelectField
        label="Bénéficiaire"
        error={errors.kind}
        input={register('kind')}
        options={KIND_OPTIONS}
      />
      {kind === 'moulder' ? (
        <SelectField
          label="Mouleur"
          error={errors.moulderId}
          input={register('moulderId', {
            validate: (value, form) =>
              form.kind !== 'moulder' || value !== '' || 'Le mouleur est requis.',
          })}
          options={[
            { value: '', label: 'Choisir…' },
            ...moulders.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
      ) : (
        <Field
          label="Nom du prestataire"
          error={errors.contractorName}
          input={register('contractorName', {
            validate: (value, form) =>
              form.kind !== 'contractor' ||
              value.trim() !== '' ||
              'Le nom du prestataire est requis.',
          })}
          suggestions={contractorNames}
        />
      )}
      <SelectField
        label="Type"
        error={errors.type}
        input={register('type')}
        options={TYPE_OPTIONS}
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
    </>
  );
}
