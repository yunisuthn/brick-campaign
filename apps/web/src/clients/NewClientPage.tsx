import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { ClientFields } from './clientFields.js';
import { type NewClient, useCreateClient } from './useClients.js';

export function NewClientPage() {
  const create = useCreateClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewClient>({ defaultValues: { name: '', phone: null, locality: '' } });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/clients') }),
  );

  return (
    <main className="page">
      <h1>{t('clients.newTitle')}</h1>
      <form onSubmit={submit} noValidate>
        <ClientFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert">
            {t('clients.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            {t('clients.createButton')}
          </button>
          <Link to="/clients">{t('common.cancel')}</Link>
        </p>
      </form>
    </main>
  );
}
