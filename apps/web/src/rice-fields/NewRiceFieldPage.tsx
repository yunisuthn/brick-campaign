import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { RiceFieldFields } from './riceFieldFields.js';
import { type NewRiceField, useCreateRiceField } from './useRiceFields.js';

export function NewRiceFieldPage() {
  const create = useCreateRiceField();
  const navigate = useNavigate();
  const form = useForm<NewRiceField>({
    defaultValues: { name: '', location: '', surfaceM2: null, contractType: 'seasonal' },
  });

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/rizieres') }),
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <h1>Nouvelle rizière</h1>
      <form onSubmit={submit} noValidate>
        <RiceFieldFields register={form.register} errors={form.formState.errors} />
        {create.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Création impossible : {create.error.message}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={create.isPending}>
            Créer la rizière
          </button>
          <Link to="/rizieres">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
