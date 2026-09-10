import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { MoulderFields } from './moulderFields.js';
import { type NewMoulder, useCreateMoulder } from './useMoulders.js';

/** Back to the list, not to the new page: a moulder is created once and then only entered against. */
export function NewMoulderPage() {
  const create = useCreateMoulder();
  const navigate = useNavigate();
  const form = useForm<NewMoulder>({ defaultValues: { name: '', memberCount: 1 } });

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/mouleurs') }),
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <h1>Nouveau mouleur</h1>
      <form onSubmit={submit} noValidate>
        <MoulderFields register={form.register} errors={form.formState.errors} />
        {create.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Création impossible : {create.error.message}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={create.isPending}>
            Créer le mouleur
          </button>
          <Link to="/mouleurs">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
