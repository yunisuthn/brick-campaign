import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field, SelectField } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import type { ContractType, NewRiceField } from './useRiceFields.js';

/** The words of the notebook: a lasting contract, or one for the season. */
export const CONTRACT_TYPE_KEY: Record<ContractType, TranslationKey> = {
  durable: 'riceFields.contract.durable',
  seasonal: 'riceFields.contract.seasonal',
};

export function surfaceText(
  surfaceM2: number | null,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return surfaceM2 === null
    ? t('riceFields.surfaceUnspecified')
    : t('riceFields.surfaceValue', { surface: surfaceM2 });
}

interface RiceFieldFieldsProps {
  register: UseFormRegister<NewRiceField>;
  errors: FieldErrors<NewRiceField>;
}

/** Shared by creation and edit. The surface is optional: left empty, it is null. */
export function RiceFieldFields({ register, errors }: RiceFieldFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Field
        label={t('riceFields.nameLabel')}
        error={errors.name}
        input={register('name', {
          setValueAs: (value: string) => value.trim(),
          required: t('riceFields.nameRequired'),
        })}
      />
      <Field
        label={t('riceFields.locationLabel')}
        error={errors.location}
        input={register('location', {
          setValueAs: (value: string) => value.trim(),
          required: t('riceFields.locationRequired'),
        })}
      />
      <Field
        label={t('riceFields.surfaceLabel')}
        error={errors.surfaceM2}
        input={register('surfaceM2', {
          setValueAs: (value: unknown) =>
            value === '' || value === null ? null : Number(digitsOnly(value as string)),
          validate: (value) =>
            value === null ||
            (Number.isInteger(value) && value > 0) ||
            t('riceFields.surfaceInvalid'),
        })}
        inputMode="numeric"
      />
      <SelectField
        label={t('riceFields.contractTypeLabel')}
        error={errors.contractType}
        input={register('contractType')}
        options={(Object.keys(CONTRACT_TYPE_KEY) as ContractType[]).map((value) => ({
          value,
          label: t(CONTRACT_TYPE_KEY[value]),
        }))}
      />
    </>
  );
}
