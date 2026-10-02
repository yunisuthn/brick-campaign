import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { TextField } from '@/components/fields';
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
      <TextField
        label={t('clients.nameLabel')}
        error={errors.name}
        registration={register('name', {
          setValueAs: trimmed,
          required: t('clients.nameRequired'),
        })}
      />
      <TextField
        label={t('clients.phoneLabel')}
        type="tel"
        error={errors.phone}
        registration={register('phone', {
          setValueAs: (value: string | null) => {
            const text = value?.trim() ?? '';
            return text === '' ? null : text;
          },
        })}
      />
      <TextField
        label={t('clients.localityLabel')}
        error={errors.locality}
        registration={register('locality', {
          setValueAs: trimmed,
          required: t('clients.localityRequired'),
        })}
      />
    </>
  );
}
