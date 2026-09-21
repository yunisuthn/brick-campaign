import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { RiceFieldFields } from './riceFieldFields.js';
import { type NewRiceField, useCreateRiceField } from './useRiceFields.js';

export function NewRiceFieldPage() {
  const create = useCreateRiceField();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewRiceField>({
    defaultValues: { name: '', location: '', surfaceM2: null, contractType: 'seasonal' },
  });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/rizieres') }),
  );

  return (
    <main className="page">
      <h1>{t('riceFields.newTitle')}</h1>
      <form onSubmit={submit} noValidate>
        <RiceFieldFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert">
            {t('riceFields.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            {t('riceFields.createButton')}
          </button>
          <Link to="/rizieres">{t('common.cancel')}</Link>
        </p>
      </form>
    </main>
  );
}
