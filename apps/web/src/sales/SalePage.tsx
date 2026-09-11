import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { type Client, useClients } from '../clients/useClients.js';
import { SaleDeliveries } from '../deliveries/SaleDeliveries.js';
import { Field, SelectField } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { SalePayments } from '../sale-payments/SalePayments.js';
import {
  type Sale,
  SALE_STATUS_LABELS,
  useCancelSale,
  useSale,
  useUpdateSale,
} from './useSales.js';

interface SaleForm {
  clientId: string;
  date: string;
  orderedQuantity: string;
  unitPrice: string;
}

export function SalePage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to="/ventes">Toutes les ventes</Link>
      </p>
      {campaign ? <LoadedSale campaignId={campaign.id} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

function LoadedSale({ campaignId, id }: { campaignId: string; id: string }) {
  const sale = useSale(campaignId, id);
  const clients = useClients();

  if (sale.isError) return <p role="alert">{loadErrorMessage(sale.error, 'Vente introuvable.')}</p>;
  if (clients.isError)
    return <p role="alert">Chargement impossible : {apiErrorMessage(clients.error)}</p>;
  if (!sale.isSuccess || !clients.isSuccess) return <p role="status">Chargement…</p>;

  return (
    <>
      <SaleHeading sale={sale.data} clients={clients.data} />
      <SaleDeliveries campaignId={campaignId} saleId={sale.data.id} />
      <SalePayments sale={sale.data} />
      <SaleForm key={sale.data.id} sale={sale.data} clients={clients.data} />
    </>
  );
}

function SaleHeading({ sale, clients }: { sale: Sale; clients: ReadonlyArray<Client> }) {
  const name = clients.find((client) => client.id === sale.clientId)?.name ?? 'Client inconnu';
  return (
    <h1>
      {name}
      <span className="title-sub">
        {formatDate(sale.date)} · {SALE_STATUS_LABELS[sale.status]} · {formatAmount(sale.total)}
      </span>
      <span className="title-sub">
        {formatBricks(sale.deliveredQuantity)} livrées sur {formatBricks(sale.orderedQuantity)}
      </span>
    </h1>
  );
}

/** The instalments are left out of this form: they have their own section, above. */
function SaleForm({ sale, clients }: { sale: Sale; clients: ReadonlyArray<Client> }) {
  const update = useUpdateSale(sale.campaignId, sale.id);
  const cancel = useCancelSale(sale.campaignId, sale.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<SaleForm>({
    defaultValues: {
      clientId: sale.clientId,
      date: sale.date,
      orderedQuantity: String(sale.orderedQuantity),
      unitPrice: String(sale.unitPrice),
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        clientId: values.clientId,
        date: values.date,
        orderedQuantity: Number(values.orderedQuantity),
        unitPrice: Number(values.unitPrice),
      },
      { onSuccess: (saved) => form.reset({ ...values, unitPrice: String(saved.unitPrice) }) },
    ),
  );
  const cancelSale = () => cancel.mutate(undefined, { onSuccess: () => navigate('/ventes') });
  const busy = update.isPending || cancel.isPending;

  return (
    <form onSubmit={save} noValidate>
      <SelectField
        label="Client"
        error={form.formState.errors.clientId ?? updateRefusal.fields.clientId}
        input={form.register('clientId', { required: 'Le client est requis.' })}
        options={clients.map((client) => ({ value: client.id, label: client.name }))}
      />
      <Field
        label="Date"
        error={form.formState.errors.date ?? updateRefusal.fields.date}
        input={form.register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <Field
        label="Quantité commandée (briques)"
        error={form.formState.errors.orderedQuantity ?? updateRefusal.fields.orderedQuantity}
        input={form.register('orderedQuantity', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un nombre entier de briques est attendu.',
        })}
        inputMode="numeric"
      />
      <Field
        label="Prix unitaire (Ar la brique)"
        error={form.formState.errors.unitPrice ?? updateRefusal.fields.unitPrice}
        input={form.register('unitPrice', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un prix entier en ariary est attendu.',
        })}
        inputMode="numeric"
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
            <button type="button" onClick={cancelSale} disabled={busy}>
              Confirmer l’annulation
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
              Garder la vente
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
            Annuler la vente
          </button>
        )}
      </p>
    </form>
  );
}
