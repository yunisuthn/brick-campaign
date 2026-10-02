import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField, NumberField, SelectField } from '@/components/fields';
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

  return (
    <>
      {showEndedOn ? (
        <div className="grid grid-cols-2 gap-3">
          <DateField
            label={t('productions.startedOnLabel')}
            name="startedOn"
            control={control}
            error={errors.startedOn}
            required={t('productions.startedOnRequired')}
          />
          <DateField
            label={t('productions.endedOnLabel')}
            name="endedOn"
            control={control}
            error={errors.endedOn}
          />
          <p className="col-span-2 -mt-1 text-sm text-muted-foreground">
            {t('productions.endedOnHint')}
          </p>
        </div>
      ) : (
        <DateField
          label={t('productions.startedOnLabel')}
          name="startedOn"
          control={control}
          error={errors.startedOn}
          required={t('productions.startedOnRequired')}
        />
      )}
      <SelectField
        label={t('common.moulderLabel')}
        name="moulderId"
        control={control}
        error={errors.moulderId}
        rules={{ required: t('common.moulderRequired') }}
        placeholder={t('common.choose')}
        options={moulders.map((m) => ({ value: m.id, label: m.name }))}
      />
      <SelectField
        label={t('productions.riceFieldLabel')}
        name="riceFieldId"
        control={control}
        error={errors.riceFieldId}
        rules={{ required: t('productions.riceFieldRequired') }}
        placeholder={t('common.choose')}
        options={riceFields.map((f) => ({ value: f.id, label: f.name }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('productions.quantityLabel')}
          error={errors.quantity}
          registration={register('quantity', {
            validate: (value) =>
              (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
              t('productions.quantityRequired'),
          })}
        />
        <SelectField
          label={t('productions.rateLabel')}
          name="rate"
          control={control}
          error={errors.rate}
          options={[
            { value: '', label: t('productions.rateToFix') },
            ...rates.map((rate) => ({
              value: String(rate),
              label: t('productions.rateOption', { rate }),
            })),
          ]}
        />
      </div>
    </>
  );
}
