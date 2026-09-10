import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/client.js';
import { MoulderFields } from './moulderFields.js';
import { type Moulder, type NewMoulder, useMoulder, useUpdateMoulder } from './useMoulders.js';

function loadErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status === 404) return 'Mouleur introuvable.';
  return `Chargement impossible : ${error.message}`;
}

export function MoulderPage() {
  const { id = '' } = useParams();
  const moulder = useMoulder(id);

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/mouleurs">Tous les mouleurs</Link>
      </p>
      {moulder.isPending && <p role="status">Chargement…</p>}
      {moulder.isError && <p role="alert">{loadErrorMessage(moulder.error)}</p>}
      {moulder.isSuccess && <MoulderForm key={moulder.data.id} moulder={moulder.data} />}
    </main>
  );
}

/**
 * The form is always open: a moulder has two fields and correcting a name is the common case.
 * Retiring is the only way out (reference document, section 5: no physical delete), and it
 * can be undone.
 */
function MoulderForm({ moulder }: { moulder: Moulder }) {
  const update = useUpdateMoulder(moulder.id);
  const form = useForm<NewMoulder>({
    defaultValues: { name: moulder.name, memberCount: moulder.memberCount },
  });

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );
  const toggleActive = () => update.mutate({ active: !moulder.active });

  return (
    <>
      <h1>
        {moulder.name}
        {!moulder.active && (
          <span style={{ fontSize: '1rem', fontWeight: 'normal' }}> · retiré</span>
        )}
      </h1>
      <form onSubmit={save} noValidate>
        <MoulderFields register={form.register} errors={form.formState.errors} />
        {update.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Enregistrement impossible : {update.error.message}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            Enregistrer
          </button>
          <button type="button" onClick={toggleActive} disabled={update.isPending}>
            {moulder.active ? 'Retirer le mouleur' : 'Réactiver le mouleur'}
          </button>
        </p>
      </form>
    </>
  );
}
