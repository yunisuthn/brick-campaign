import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { loadErrorMessage } from '../api/loadError.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { ClientFields } from './clientFields.js';
import { type Client, type NewClient, useClient, useUpdateClient } from './useClients.js';

/**
 * A client is a name, a phone and a locality, nothing more to show: the correction opens in a
 * sheet over the list (reference document, section 10.12).
 */
export function ClientPage() {
  const { id = '' } = useParams();
  const client = useClient(id);
  const { t } = useTranslation();

  if (!client.isSuccess) {
    return (
      <RouteSheet title={t('clients.title')} closeTo="/clients">
        {client.isError ? (
          <ErrorNote message={loadErrorMessage(client.error, t('clients.notFound'))} />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </RouteSheet>
    );
  }
  return <ClientForm key={client.data.id} client={client.data} />;
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
    <RouteSheet
      title={client.name}
      description={`${client.locality}${client.phone !== null ? ` · ${client.phone}` : ''}`}
      closeTo="/clients"
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <ClientFields
          register={form.register}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
        />
        {updateRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        <SheetActions
          submitLabel={t('common.save')}
          cancelLabel={t('common.close')}
          busy={update.isPending}
          disabled={!form.formState.isDirty}
        />
      </form>
    </RouteSheet>
  );
}
