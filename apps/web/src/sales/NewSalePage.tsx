import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
import { Field, SelectField } from '../form/Field.js';
import { formatAmount, today } from '../format.js';
import { useCreateSale } from './useSales.js';

interface SaleForm {
  clientId: string;
  date: string;
  orderedQuantity: string;
  unitPrice: string;
}

export function NewSalePage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/ventes">Toutes les ventes</Link>
      </p>
      <h1>Nouvelle vente</h1>
      {campaign ? (
        <SaleForm campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant
          d’enregistrer une vente.
        </p>
      )}
    </main>
  );
}

/**
 * A sale is created ordered and unpaid: the deliveries and the payment come later, from its
 * page. The price is negotiated per sale according to the going rate (section 1), so nothing
 * is prefilled.
 */
function SaleForm({ campaignId }: { campaignId: string }) {
  const clients = useClients();
  const create = useCreateSale(campaignId);
  const navigate = useNavigate();
  const form = useForm<SaleForm>({
    defaultValues: { clientId: '', date: today(), orderedQuantity: '', unitPrice: '' },
  });

  if (clients.isError)
    return <p role="alert">Chargement impossible : {apiErrorMessage(clients.error)}</p>;
  if (!clients.isSuccess) return <p role="status">Chargement…</p>;

  const quantity = Number(form.watch('orderedQuantity'));
  const price = Number(form.watch('unitPrice'));
  const total = Number.isFinite(quantity * price) ? quantity * price : 0;

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        clientId: values.clientId,
        date: values.date,
        orderedQuantity: Number(values.orderedQuantity),
        unitPrice: Number(values.unitPrice),
      },
      { onSuccess: (sale) => navigate(`/ventes/${sale.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <SelectField
        label="Client"
        error={form.formState.errors.clientId}
        input={form.register('clientId', { required: 'Le client est requis.' })}
        options={[
          { value: '', label: 'Choisir…' },
          ...clients.data.map((client) => ({ value: client.id, label: client.name })),
        ]}
      />
      <Field
        label="Date"
        error={form.formState.errors.date}
        input={form.register('date', { required: 'La date est requise.' })}
        type="date"
      />
      <Field
        label="Quantité commandée (briques)"
        error={form.formState.errors.orderedQuantity}
        input={form.register('orderedQuantity', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un nombre entier de briques est attendu.',
        })}
        inputMode="numeric"
      />
      <Field
        label="Prix unitaire (Ar la brique)"
        error={form.formState.errors.unitPrice}
        input={form.register('unitPrice', {
          validate: (value) =>
            (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
            'Un prix entier en ariary est attendu.',
        })}
        inputMode="numeric"
      />
      <p role="status">Total : {formatAmount(total)}</p>
      {create.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {apiErrorMessage(create.error)}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer la vente
        </button>
      </p>
    </form>
  );
}
