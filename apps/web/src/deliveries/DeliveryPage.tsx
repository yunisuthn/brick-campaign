import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { type DeliveryForm, DeliveryFields, toNewDelivery } from './deliveryFields.js';
import {
  type Delivery,
  useCancelDelivery,
  useDelivery,
  useUpdateDelivery,
} from './useDeliveries.js';

export function DeliveryPage() {
  const { id: saleId = '', deliveryId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to={`/ventes/${saleId}`}>Retour à la vente</Link>
      </p>
      {campaign ? (
        <LoadedDelivery campaignId={campaign.id} saleId={saleId} id={deliveryId} />
      ) : (
        <p>Aucune campagne.</p>
      )}
    </main>
  );
}

function LoadedDelivery({
  campaignId,
  saleId,
  id,
}: {
  campaignId: string;
  saleId: string;
  id: string;
}) {
  const delivery = useDelivery(campaignId, saleId, id);

  if (delivery.isError) {
    return <p role="alert">{loadErrorMessage(delivery.error, 'Voyage introuvable.')}</p>;
  }
  if (!delivery.isSuccess) return <p role="status">Chargement…</p>;
  return <CorrectionForm key={delivery.data.id} campaignId={campaignId} delivery={delivery.data} />;
}

/** Cancelling a trip puts its bricks back in the fired stock and moves the sale's status back. */
function CorrectionForm({ campaignId, delivery }: { campaignId: string; delivery: Delivery }) {
  const update = useUpdateDelivery(campaignId, delivery.saleId, delivery.id);
  const cancel = useCancelDelivery(campaignId, delivery.saleId, delivery.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const salePath = `/ventes/${delivery.saleId}`;
  const form = useForm<DeliveryForm>({
    defaultValues: {
      date: delivery.date,
      quantity: String(delivery.quantity),
      cost: String(delivery.cost),
      plate: delivery.plate ?? '',
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(toNewDelivery(values), {
      onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }),
    }),
  );
  const cancelTrip = () => cancel.mutate(undefined, { onSuccess: () => navigate(salePath) });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <h1>
        {formatBricks(delivery.quantity)}
        <span className="title-sub">
          {formatDate(delivery.date)} · {formatAmount(delivery.cost)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <DeliveryFields
          register={form.register}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
        />
        {updateRefusal.message && (
          <p role="alert">Enregistrement impossible : {updateRefusal.message}</p>
        )}
        {cancel.isError && (
          <p role="alert">Annulation impossible : {apiErrorMessage(cancel.error)}</p>
        )}
        <p className="actions">
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            Enregistrer
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelTrip} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder le voyage
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler le voyage
            </button>
          )}
        </p>
      </form>
    </>
  );
}
