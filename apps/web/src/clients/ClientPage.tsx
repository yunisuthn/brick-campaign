import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { ClientFields } from './clientFields.js';
import { type Client, type NewClient, useClient, useUpdateClient } from './useClients.js';

export function ClientPage() {
  const { id = '' } = useParams();
  const client = useClient(id);

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/clients">Tous les clients</Link>
      </p>
      {client.isPending && <p role="status">Chargement…</p>}
      {client.isError && (
        <p role="alert">{loadErrorMessage(client.error, 'Client introuvable.')}</p>
      )}
      {client.isSuccess && <ClientForm key={client.data.id} client={client.data} />}
    </main>
  );
}

/** Always open, like the other reference data: a phone number changes more often than it is read. */
function ClientForm({ client }: { client: Client }) {
  const update = useUpdateClient(client.id);
  const form = useForm<NewClient>({
    defaultValues: { name: client.name, phone: client.phone, locality: client.locality },
  });

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );

  return (
    <>
      <h1>{client.name}</h1>
      <form onSubmit={save} noValidate>
        <ClientFields register={form.register} errors={form.formState.errors} />
        {update.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Enregistrement impossible : {apiErrorMessage(update.error)}
          </p>
        )}
        <p>
          <button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            Enregistrer
          </button>
        </p>
      </form>
    </>
  );
}
