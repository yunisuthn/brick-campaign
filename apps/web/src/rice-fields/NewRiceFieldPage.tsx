import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { RiceFieldFields } from './riceFieldFields.js';
import { type NewRiceField, useCreateRiceField } from './useRiceFields.js';

export function NewRiceFieldPage() {
  const create = useCreateRiceField();
  const navigate = useNavigate();
  const form = useForm<NewRiceField>({
    defaultValues: { name: '', location: '', surfaceM2: null, contractType: 'seasonal' },
  });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/rizieres') }),
  );

  return (
    <main className="page">
      <h1>Nouvelle rizière</h1>
      <form onSubmit={submit} noValidate>
        <RiceFieldFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && <p role="alert">Création impossible : {createRefusal.message}</p>}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            Créer la rizière
          </button>
          <Link to="/rizieres">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
