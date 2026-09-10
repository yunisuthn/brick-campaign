import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { ClientFields } from './clientFields.js';
import { type NewClient, useCreateClient } from './useClients.js';

export function NewClientPage() {
  const create = useCreateClient();
  const navigate = useNavigate();
  const form = useForm<NewClient>({ defaultValues: { name: '', phone: null, locality: '' } });

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/clients') }),
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <h1>Nouveau client</h1>
      <form onSubmit={submit} noValidate>
        <ClientFields register={form.register} errors={form.formState.errors} />
        {create.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Création impossible : {create.error.message}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={create.isPending}>
            Créer le client
          </button>
          <Link to="/clients">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
