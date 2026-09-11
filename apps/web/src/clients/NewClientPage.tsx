import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { ClientFields } from './clientFields.js';
import { type NewClient, useCreateClient } from './useClients.js';

export function NewClientPage() {
  const create = useCreateClient();
  const navigate = useNavigate();
  const form = useForm<NewClient>({ defaultValues: { name: '', phone: null, locality: '' } });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/clients') }),
  );

  return (
    <main className="page">
      <h1>Nouveau client</h1>
      <form onSubmit={submit} noValidate>
        <ClientFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && <p role="alert">Création impossible : {createRefusal.message}</p>}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            Créer le client
          </button>
          <Link to="/clients">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
