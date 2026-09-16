import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { NewMoulder } from './useMoulders.js';

/** Plural the French way: one member, two members. */
export function membersText(count: number, t: ReturnType<typeof useTranslation>['t']): string {
  return count === 1 ? t('moulders.member') : t('moulders.members', { count });
}

interface MoulderFieldsProps {
  register: UseFormRegister<NewMoulder>;
  errors: FieldErrors<NewMoulder>;
}

/** Name of the person in charge and size of the household; shared by creation and edit. */
export function MoulderFields({ register, errors }: MoulderFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Field
        label={t('moulders.nameLabel')}
        error={errors.name}
        input={register('name', {
          setValueAs: (value: string) => value.trim(),
          required: t('moulders.nameRequired'),
        })}
      />
      <Field
        label={t('moulders.memberCountLabel')}
        error={errors.memberCount}
        input={register('memberCount', {
          setValueAs: (value: string) => Number(digitsOnly(value)),
          validate: (value) =>
            (Number.isInteger(value) && value >= 1 && value <= 20) ||
            t('moulders.memberCountRequired'),
        })}
        inputMode="numeric"
      />
    </>
  );
}
