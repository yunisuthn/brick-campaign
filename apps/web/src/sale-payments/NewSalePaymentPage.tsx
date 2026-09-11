import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, today } from '../format.js';
import { useSale } from '../sales/useSales.js';
import { type SalePaymentForm, SalePaymentFields, toNewSalePayment } from './salePaymentFields.js';
import { useCreateSalePayment } from './useSalePayments.js';

export function NewSalePaymentPage() {
  const { id: saleId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to={`/ventes/${saleId}`}>Retour à la vente</Link>
      </p>
      <h1>Nouvel encaissement</h1>
      {campaign ? (
        <PaymentForm campaignId={campaign.id} saleId={saleId} />
      ) : (
        <p>Aucune campagne.</p>
      )}
    </main>
  );
}

/**
 * What is left to pay is shown and proposed as the amount: a client settling the whole rest is
 * the common case, and the API refuses anything above it anyway.
 */
function PaymentForm({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const sale = useSale(campaignId, saleId);
  const create = useCreateSalePayment(campaignId, saleId);
  const navigate = useNavigate();
  const form = useForm<SalePaymentForm>({ defaultValues: { date: today(), amount: '' } });

  if (sale.isError) return <p role="alert">{loadErrorMessage(sale.error, 'Vente introuvable.')}</p>;
  if (!sale.isSuccess) return <p role="status">Chargement…</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewSalePayment(values), { onSuccess: () => navigate(`/ventes/${saleId}`) }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <p role="status">Reste à encaisser : {formatAmount(sale.data.outstanding)}.</p>
      <SalePaymentFields
        register={form.register}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
      />
      {createRefusal.message && (
        <p role="alert">Encaissement impossible : {createRefusal.message}</p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Encaisser
        </button>
      </p>
    </form>
  );
}
