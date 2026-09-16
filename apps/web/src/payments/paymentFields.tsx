import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { DateField } from '../form/DateField.js';
import { Field, SelectField } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import type { Moulder } from '../moulders/useMoulders.js';
import { type NewPayment, paymentTypes, type PaymentType } from './usePayments.js';

export const PAYMENT_TYPE_KEY: Record<PaymentType, TranslationKey> = {
  vatsy: 'payments.type.vatsy',
  advance: 'payments.type.advance',
  settlement: 'payments.type.settlement',
};

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
  const common = { date: form.date, type: form.type, amount: Number(digitsOnly(form.amount)) };
  return form.kind === 'moulder'
    ? { ...common, moulderId: form.moulderId }
    : { ...common, contractorName: form.contractorName.trim() };
}

interface PaymentFieldsProps {
  register: UseFormRegister<PaymentForm>;
  watch: UseFormWatch<PaymentForm>;
  control: Control<PaymentForm>;
  errors: FieldErrors<PaymentForm>;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  /** Contractor names already seen in the campaign, offered as suggestions. */
  contractorNames: ReadonlyArray<string>;
}

/** Shared by the entry and the correction; the lists to choose from come from the page. */
export function PaymentFields({
  register,
  watch,
  control,
  errors,
  moulders,
  contractorNames,
}: PaymentFieldsProps) {
  const kind = watch('kind');
  const { t } = useTranslation();

  const kindOptions = [
    { value: 'moulder', label: t('common.moulderLabel') },
    { value: 'contractor', label: t('payments.contractorLabel') },
  ];
  const typeOptions = paymentTypes.map((type) => ({ value: type, label: t(PAYMENT_TYPE_KEY[type]) }));

  return (
    <>
      <DateField
        label={t('common.date')}
        name="date"
        control={control}
        error={errors.date}
        required={t('common.dateRequired')}
      />
      <SelectField
        label={t('payments.beneficiaryLabel')}
        error={errors.kind}
        input={register('kind')}
        options={kindOptions}
      />
      {kind === 'moulder' ? (
        <SelectField
          label={t('common.moulderLabel')}
          error={errors.moulderId}
          input={register('moulderId', {
            validate: (value, form) =>
              form.kind !== 'moulder' || value !== '' || t('common.moulderRequired'),
          })}
          options={[
            { value: '', label: t('common.choose') },
            ...moulders.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
      ) : (
        <Field
          label={t('payments.contractorNameLabel')}
          error={errors.contractorName}
          input={register('contractorName', {
            validate: (value, form) =>
              form.kind !== 'contractor' ||
              value.trim() !== '' ||
              t('payments.contractorNameRequired'),
          })}
          suggestions={contractorNames}
        />
      )}
      <SelectField
        label={t('common.type')}
        error={errors.type}
        input={register('type')}
        options={typeOptions}
      />
      <Field
        label={t('payments.amountLabel')}
        error={errors.amount}
        input={register('amount', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('common.amountRequiredInteger'),
        })}
        inputMode="numeric"
      />
    </>
  );
}
