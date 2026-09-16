import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { DateField } from '../form/DateField.js';
import { Field, SelectField } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import { type ContractorWorkType, contractorWorkTypes } from './useContractorWorks.js';

export const WORK_TYPE_KEY: Record<ContractorWorkType, TranslationKey> = {
  transport: 'contractorWorks.type.transport',
  kiln_loading: 'contractorWorks.type.kiln_loading',
};

/** The quantity stays text until submit, so an empty field is empty and not NaN; the rate is ''
 * while not yet fixed, and only means anything for a transport entry. */
export interface ContractorWorkForm {
  date: string;
  type: string;
  contractorName: string;
  quantity: string;
  rate: string;
}

interface ContractorWorkFieldsProps {
  register: UseFormRegister<ContractorWorkForm>;
  control: Control<ContractorWorkForm>;
  errors: FieldErrors<ContractorWorkForm>;
  /** Contractor names already seen in the campaign, offered as suggestions. */
  contractorNames: ReadonlyArray<string>;
  /** The currently chosen type, to show the rate picker only for transport. */
  type: string;
  /** The campaign's transport prices to pick from; empty while none is fixed yet. */
  rates: ReadonlyArray<number>;
}

/** Shared by the entry and the correction. The batch a work belongs to comes from the URL. */
export function ContractorWorkFields({
  register,
  control,
  errors,
  contractorNames,
  type,
  rates,
}: ContractorWorkFieldsProps) {
  const { t } = useTranslation();
  const typeOptions = contractorWorkTypes.map((value) => ({ value, label: t(WORK_TYPE_KEY[value]) }));

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
        label={t('contractorWorks.typeLabel')}
        error={errors.type}
        input={register('type')}
        options={typeOptions}
      />
      <Field
        label={t('contractorWorks.contractorNameLabel')}
        error={errors.contractorName}
        input={register('contractorName', {
          setValueAs: (value: string) => value.trim(),
          required: t('contractorWorks.contractorNameRequired'),
        })}
        suggestions={contractorNames}
      />
      <Field
        label={t('contractorWorks.quantityLabel')}
        error={errors.quantity}
        input={register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('contractorWorks.quantityRequired'),
        })}
        inputMode="numeric"
      />
      {type === 'transport' && (
        <SelectField
          label={t('contractorWorks.rateLabel')}
          error={errors.rate}
          input={register('rate')}
          options={[
            { value: '', label: t('contractorWorks.rateToFix') },
            ...rates.map((rate) => ({ value: String(rate), label: t('contractorWorks.rateOption', { rate }) })),
          ]}
        />
      )}
    </>
  );
}
