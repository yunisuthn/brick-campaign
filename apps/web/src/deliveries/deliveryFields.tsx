import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField } from '../form/DateField.js';
import { Field } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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
    quantity: Number(digitsOnly(form.quantity)),
    cost: Number(digitsOnly(form.cost)),
    plate: form.plate.trim() === '' ? null : form.plate.trim(),
  };
}

interface DeliveryFieldsProps {
  register: UseFormRegister<DeliveryForm>;
  control: Control<DeliveryForm>;
  errors: FieldErrors<DeliveryForm>;
}

/** Shared by the entry and the correction. A trip carries 2 300 to 2 500 bricks, not capped. */
export function DeliveryFields({ register, control, errors }: DeliveryFieldsProps) {
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
      <Field
        label={t('deliveries.quantityLabel')}
        error={errors.quantity}
        input={register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('deliveries.quantityRequired'),
        })}
        inputMode="numeric"
      />
      <Field
        label={t('deliveries.costLabel')}
        error={errors.cost}
        input={register('cost', {
          validate: (value) => /^\d+$/.test(digitsOnly(value)) || t('deliveries.costRequired'),
        })}
        inputMode="numeric"
      />
      <Field label={t('deliveries.plateLabel')} error={errors.plate} input={register('plate')} />
    </>
  );
}
