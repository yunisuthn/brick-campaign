import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatBricks, today } from '../format.js';
import { useStock } from '../stock/useStock.js';
import { type DeliveryForm, DeliveryFields, toNewDelivery } from './deliveryFields.js';
import { useCreateDelivery } from './useDeliveries.js';

export function NewDeliveryPage() {
  const { id: saleId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to={`/ventes/${saleId}`}>Retour à la vente</Link>
      </p>
      <h1>Nouveau voyage</h1>
      {campaign ? <TripForm campaignId={campaign.id} saleId={saleId} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

/**
 * The fired stock is shown beside the quantity: the API refuses to deliver more bricks than
 * came out of the kiln, and knowing the figure beforehand saves a round trip.
 */
function TripForm({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const stock = useStock(campaignId);
  const create = useCreateDelivery(campaignId, saleId);
  const navigate = useNavigate();
  const form = useForm<DeliveryForm>({
    defaultValues: { date: today(), quantity: '', cost: '', plate: '' },
  });

  if (stock.isError)
    return <p role="alert">Chargement impossible : {apiErrorMessage(stock.error)}</p>;
  if (!stock.isSuccess) return <p role="status">Chargement…</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewDelivery(values), { onSuccess: () => navigate(`/ventes/${saleId}`) }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <p role="status">Stock cuite : {formatBricks(stock.data.fired)}.</p>
      <DeliveryFields
        register={form.register}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
      />
      {createRefusal.message && (
        <p role="alert">Enregistrement impossible : {createRefusal.message}</p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer le voyage
        </button>
      </p>
    </form>
  );
}
