import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Field } from '../form/Field.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { NewClient } from './useClients.js';

const trimmed = (value: string) => value.trim();

interface ClientFieldsProps {
  register: UseFormRegister<NewClient>;
  errors: FieldErrors<NewClient>;
}

/** Shared by creation and edit. The phone is optional: left empty, it is null. */
export function ClientFields({ register, errors }: ClientFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <Field
        label={t('clients.nameLabel')}
        error={errors.name}
        input={register('name', { setValueAs: trimmed, required: t('clients.nameRequired') })}
      />
      <Field
        label={t('clients.phoneLabel')}
        error={errors.phone}
        input={register('phone', {
          setValueAs: (value: string | null) => {
            const text = value?.trim() ?? '';
            return text === '' ? null : text;
          },
        })}
        type="tel"
        inputMode="tel"
      />
      <Field
        label={t('clients.localityLabel')}
        error={errors.locality}
        input={register('locality', {
          setValueAs: trimmed,
          required: t('clients.localityRequired'),
        })}
      />
    </>
  );
}
