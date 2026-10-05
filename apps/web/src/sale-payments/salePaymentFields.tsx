import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField, NumberField } from '@/components/fields';
import { digitsOnly } from '../form/numeric.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { NewSalePayment } from './useSalePayments.js';

/** The amount stays text until submit, so an empty field is empty and not NaN. */
export interface SalePaymentForm {
  date: string;
  amount: string;
}

export function toNewSalePayment(form: SalePaymentForm): NewSalePayment {
  return { date: form.date, amount: Number(digitsOnly(form.amount)) };
}

interface SalePaymentFieldsProps {
  register: UseFormRegister<SalePaymentForm>;
  control: Control<SalePaymentForm>;
  errors: FieldErrors<SalePaymentForm>;
}

/** Shared by the entry and the correction. What is left to pay is shown by the sheet around it. */
export function SalePaymentFields({ register, control, errors }: SalePaymentFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <DateField
        label={t('common.date')}
        name="date"
        control={control}
        error={errors.date}
        required={t('common.dateRequired')}
      />
      <NumberField
        label={t('salePayments.amountLabel')}
        error={errors.amount}
        registration={register('amount', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('common.amountRequiredInteger'),
        })}
      />
    </>
  );
}
