import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { RiceFieldExpenses } from '../expenses/RiceFieldExpenses.js';
import { RiceFieldFields } from './riceFieldFields.js';
import {
  type NewRiceField,
  type RiceField,
  useRiceField,
  useUpdateRiceField,
} from './useRiceFields.js';

export function RiceFieldPage() {
  const { id = '' } = useParams();
  const field = useRiceField(id);

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/rizieres">Toutes les rizières</Link>
      </p>
      {field.isPending && <p role="status">Chargement…</p>}
      {field.isError && <p role="alert">{loadErrorMessage(field.error, 'Rizière introuvable.')}</p>}
      {field.isSuccess && <RiceFieldForm key={field.data.id} field={field.data} />}
    </main>
  );
}

/** Always open, like the moulder's: a rice field is corrected more often than read. */
function RiceFieldForm({ field }: { field: RiceField }) {
  const update = useUpdateRiceField(field.id);
  const form = useForm<NewRiceField>({
    defaultValues: {
      name: field.name,
      location: field.location,
      surfaceM2: field.surfaceM2,
      contractType: field.contractType,
    },
  });

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );

  return (
    <>
      <h1>{field.name}</h1>
      <form onSubmit={save} noValidate>
        <RiceFieldFields register={form.register} errors={form.formState.errors} />
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
      <RiceFieldExpenses riceFieldId={field.id} />
    </>
  );
}
