import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { Field } from '../form/Field.js';
import { formatBricks, today } from '../format.js';
import { useStock } from '../stock/useStock.js';
import { MIN_KILN_BATCH_QUANTITY, useCreateKilnBatch } from './useKilnBatches.js';

interface KilnBatchForm {
  loadedOn: string;
  quantity: string;
}

export function NewKilnBatchPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/lots">Tous les lots</Link>
      </p>
      <h1>Enfourner un lot</h1>
      {campaign ? (
        <LoadForm campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant
          d’enfourner.
        </p>
      )}
    </main>
  );
}

/**
 * The raw stock is shown beside the quantity: the API refuses to load more than what was
 * moulded, and knowing the figure beforehand saves a round trip. The minimum of 40 000 bricks
 * is the rule of section 1; the API keeps it too.
 */
function LoadForm({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const create = useCreateKilnBatch(campaignId);
  const navigate = useNavigate();
  const form = useForm<KilnBatchForm>({ defaultValues: { loadedOn: today(), quantity: '' } });

  if (stock.isError)
    return <p role="alert">Chargement impossible : {apiErrorMessage(stock.error)}</p>;
  if (!stock.isSuccess) return <p role="status">Chargement…</p>;

  const submit = form.handleSubmit((values) =>
    create.mutate(
      { loadedOn: values.loadedOn, unloadedOn: null, quantity: Number(values.quantity) },
      { onSuccess: (batch) => navigate(`/lots/${batch.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <p role="status">Stock crue : {formatBricks(stock.data.raw)}.</p>
      <Field
        label="Date d’enfournement"
        error={form.formState.errors.loadedOn}
        input={form.register('loadedOn', { required: 'La date est requise.' })}
        type="date"
      />
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
      {create.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enfournement impossible : {apiErrorMessage(create.error)}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enfourner
        </button>
      </p>
    </form>
  );
}
