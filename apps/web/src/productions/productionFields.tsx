import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField } from '../form/DateField.js';
import { Field, SelectField } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { Moulder } from '../moulders/useMoulders.js';
import type { RiceField } from '../rice-fields/useRiceFields.js';
import type { NewProduction } from './useProductions.js';

/**
 * What the form holds: the quantity stays text until submit, so an empty field is empty and
 * not NaN, the two ids are '' until chosen, and the rate is '' while not yet fixed. `endedOn` is
 * '' while the work is not finished, and only shown once it can be (see `showEndedOn`).
 */
export interface ProductionForm {
  startedOn: string;
  endedOn: string;
  moulderId: string;
  riceFieldId: string;
  quantity: string;
  rate: string;
}

export function toNewProduction(form: ProductionForm): NewProduction {
  return {
    ...form,
    endedOn: form.endedOn === '' ? null : form.endedOn,
    quantity: Number(digitsOnly(form.quantity)),
    rate: form.rate === '' ? null : Number(form.rate),
  };
}

interface ProductionFieldsProps {
  register: UseFormRegister<ProductionForm>;
  control: Control<ProductionForm>;
  errors: FieldErrors<ProductionForm>;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  riceFields: ReadonlyArray<Pick<RiceField, 'id' | 'name'>>;
  /** The campaign's moulding prices to pick from; empty while none is fixed yet. */
  rates: ReadonlyArray<number>;
  /** A new entry starts still in progress; the end date is a correction, set once known. */
  showEndedOn?: boolean;
}

/** Shared by the entry and the correction; the lists to choose from come from the page. */
export function ProductionFields({
  register,
  control,
  errors,
  moulders,
  riceFields,
  rates,
  showEndedOn = false,
}: ProductionFieldsProps) {
  const { t } = useTranslation();
  const choose = { value: '', label: t('common.choose') };

  return (
    <>
      <DateField
        label={t('productions.startedOnLabel')}
        name="startedOn"
        control={control}
        error={errors.startedOn}
        required={t('productions.startedOnRequired')}
      />
      {showEndedOn && (
        <>
          <DateField
            label={t('productions.endedOnLabel')}
            name="endedOn"
            control={control}
            error={errors.endedOn}
          />
          <p className="sub">{t('productions.endedOnHint')}</p>
        </>
      )}
      <SelectField
        label={t('common.moulderLabel')}
        error={errors.moulderId}
        name="moulderId"
        control={control}
        rules={{ required: t('common.moulderRequired') }}
        options={[choose, ...moulders.map((m) => ({ value: m.id, label: m.name }))]}
      />
      <SelectField
        label={t('productions.riceFieldLabel')}
        error={errors.riceFieldId}
        name="riceFieldId"
        control={control}
        rules={{ required: t('productions.riceFieldRequired') }}
        options={[choose, ...riceFields.map((f) => ({ value: f.id, label: f.name }))]}
      />
      <Field
        label={t('productions.quantityLabel')}
        error={errors.quantity}
        input={register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('productions.quantityRequired'),
        })}
        inputMode="numeric"
      />
      <SelectField
        label={t('productions.rateLabel')}
        error={errors.rate}
        name="rate"
        control={control}
        options={[
          { value: '', label: t('productions.rateToFix') },
          ...rates.map((rate) => ({
            value: String(rate),
            label: t('productions.rateOption', { rate }),
          })),
        ]}
      />
    </>
  );
}
