import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { ClientFields } from './clientFields.js';
import { type Client, type NewClient, useClient, useUpdateClient } from './useClients.js';

export function ClientPage() {
  const { id = '' } = useParams();
  const client = useClient(id);
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/clients">{t('clients.allClients')}</Link>
      </p>
      {client.isPending && <p role="status">{t('common.loading')}</p>}
      {client.isError && (
        <p role="alert">{loadErrorMessage(client.error, t('clients.notFound'))}</p>
      )}
      {client.isSuccess && <ClientForm key={client.data.id} client={client.data} />}
    </main>
  );
}

/** Always open, like the other reference data: a phone number changes more often than it is read. */
function ClientForm({ client }: { client: Client }) {
  const update = useUpdateClient(client.id);
  const { t } = useTranslation();
  const form = useForm<NewClient>({
    defaultValues: { name: client.name, phone: client.phone, locality: client.locality },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );

  return (
    <>
      <h1>{client.name}</h1>
      <form onSubmit={save} noValidate>
        <ClientFields
          register={form.register}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
        />
        {updateRefusal.message && (
          <p role="alert">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        <p>
          <button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {t('common.save')}
          </button>
        </p>
      </form>
    </>
  );
}
