import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { BatchWorks } from '../contractor-works/BatchWorks.js';
import { Field } from '../form/Field.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import {
  type KilnBatch,
  MIN_KILN_BATCH_QUANTITY,
  useCancelKilnBatch,
  useKilnBatch,
  useUpdateKilnBatch,
} from './useKilnBatches.js';

interface KilnBatchForm {
  loadedOn: string;
  unloadedOn: string;
  quantity: string;
}

export function KilnBatchPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/lots">Tous les lots</Link>
      </p>
      {campaign ? <LoadedBatch campaignId={campaign.id} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

function LoadedBatch({ campaignId, id }: { campaignId: string; id: string }) {
  const batch = useKilnBatch(campaignId, id);

  if (batch.isError) {
    return <p role="alert">{loadErrorMessage(batch.error, 'Lot introuvable.')}</p>;
  }
  if (!batch.isSuccess) return <p role="status">Chargement…</p>;
  return <BatchForm key={batch.data.id} batch={batch.data} />;
}

/**
 * One form for the whole batch. The unloading date is a field like the others, left empty
 * while the batch is still firing: emptying it puts the batch back in the kiln, which the API
 * allows and the stock follows at once.
 */
function BatchForm({ batch }: { batch: KilnBatch }) {
  const update = useUpdateKilnBatch(batch.campaignId, batch.id);
  const cancel = useCancelKilnBatch(batch.campaignId, batch.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<KilnBatchForm>({
    defaultValues: {
      loadedOn: batch.loadedOn,
      unloadedOn: batch.unloadedOn ?? '',
      quantity: String(batch.quantity),
    },
  });

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        loadedOn: values.loadedOn,
        unloadedOn: values.unloadedOn === '' ? null : values.unloadedOn,
        quantity: Number(values.quantity),
      },
      { onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }) },
    ),
  );
  const cancelBatch = () => cancel.mutate(undefined, { onSuccess: () => navigate('/lots') });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <h1>
        {formatBricks(batch.quantity)}
        <span style={{ display: 'block', fontSize: '1rem', fontWeight: 'normal' }}>
          Enfourné le {formatDate(batch.loadedOn)} ·{' '}
          {batch.unloadedOn === null
            ? 'encore au four'
            : `défourné le ${formatDate(batch.unloadedOn)}`}
        </span>
      </h1>
      <Cost cost={batch.cost} />
      <BatchWorks campaignId={batch.campaignId} batchId={batch.id} />
      <form onSubmit={save} noValidate>
        <Field
          label="Date d’enfournement"
          error={form.formState.errors.loadedOn}
          input={form.register('loadedOn', { required: 'La date d’enfournement est requise.' })}
          type="date"
        />
        <Field
          label="Date de défournement"
          error={form.formState.errors.unloadedOn}
          input={form.register('unloadedOn')}
          type="date"
        />
        <p style={{ margin: '-0.5rem 0 0.75rem', fontSize: '0.875rem' }}>
          Laissée vide tant que le lot est au four.
        </p>
        <Field
          label="Quantité (briques)"
          error={form.formState.errors.quantity}
          input={form.register('quantity', {
            validate: (value) =>
              (/^\d+$/.test(value.trim()) && Number(value) >= MIN_KILN_BATCH_QUANTITY) ||
              `Un lot est de ${MIN_KILN_BATCH_QUANTITY.toLocaleString('fr-FR')} briques au minimum.`,
          })}
          inputMode="numeric"
        />
        {update.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Enregistrement impossible : {apiErrorMessage(update.error)}
          </p>
        )}
        {cancel.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Annulation impossible : {apiErrorMessage(cancel.error)}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            Enregistrer
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelBatch} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder le lot
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler le lot
            </button>
          )}
        </p>
      </form>
    </>
  );
}

/** Linked expenses plus the works of the batch at their campaign rates. */
function Cost({ cost }: { cost: KilnBatch['cost'] }) {
  return (
    <section aria-label="Coût du lot">
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 0.75rem' }}>
        <dt>Dépenses</dt>
        <dd style={{ margin: 0 }}>{formatAmount(cost.expenses)}</dd>
        <dt>Main-d’œuvre</dt>
        <dd style={{ margin: 0 }}>
          {cost.labour === null ? <em>Tarif à fixer</em> : formatAmount(cost.labour)}
        </dd>
        <dt>Total</dt>
        <dd style={{ margin: 0, fontWeight: 'bold' }}>
          {cost.total === null ? <em>Tarif à fixer</em> : formatAmount(cost.total)}
        </dd>
      </dl>
    </section>
  );
}
