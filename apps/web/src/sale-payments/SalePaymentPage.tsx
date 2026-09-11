import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount } from '../format.js';
import { useSale } from '../sales/useSales.js';
import { type SalePaymentForm, SalePaymentFields } from './salePaymentFields.js';
import {
  type SalePayment,
  useCancelSalePayment,
  useSalePayment,
  useUpdateSalePayment,
} from './useSalePayments.js';

export function SalePaymentPage() {
  const { id: saleId = '', paymentId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to={`/ventes/${saleId}`}>Retour à la vente</Link>
      </p>
      <h1>Encaissement</h1>
      {campaign ? (
        <Loaded campaignId={campaign.id} saleId={saleId} id={paymentId} />
      ) : (
        <p>Aucune campagne.</p>
      )}
    </main>
  );
}

function Loaded({ campaignId, saleId, id }: { campaignId: string; saleId: string; id: string }) {
  const payment = useSalePayment(campaignId, saleId, id);
  const sale = useSale(campaignId, saleId);

  if (payment.isError) {
    return <p role="alert">{loadErrorMessage(payment.error, 'Encaissement introuvable.')}</p>;
  }
  if (sale.isError) return <p role="alert">{loadErrorMessage(sale.error, 'Vente introuvable.')}</p>;
  if (!payment.isSuccess || !sale.isSuccess) return <p role="status">Chargement…</p>;

  return (
    <CorrectionForm
      key={payment.data.id}
      campaignId={campaignId}
      saleId={saleId}
      payment={payment.data}
      // What could be raised to, this instalment set aside: the same figure the API weighs against.
      ceiling={sale.data.outstanding + payment.data.amount}
    />
  );
}

function CorrectionForm({
  campaignId,
  saleId,
  payment,
  ceiling,
}: {
  campaignId: string;
  saleId: string;
  payment: SalePayment;
  ceiling: number;
}) {
  const update = useUpdateSalePayment(campaignId, saleId, payment.id);
  const cancel = useCancelSalePayment(campaignId, saleId, payment.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<SalePaymentForm>({
    defaultValues: { date: payment.date, amount: String(payment.amount) },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      { date: values.date, amount: Number(values.amount) },
      { onSuccess: (saved) => form.reset({ date: saved.date, amount: String(saved.amount) }) },
    ),
  );
  const cancelPayment = () =>
    cancel.mutate(undefined, { onSuccess: () => navigate(`/ventes/${saleId}`) });
  const busy = update.isPending || cancel.isPending;

  return (
    <form onSubmit={save} noValidate>
      <p role="status">Cet encaissement peut aller jusqu’à {formatAmount(ceiling)}.</p>
      <SalePaymentFields
        register={form.register}
        errors={{ ...form.formState.errors, ...updateRefusal.fields }}
      />
      {updateRefusal.message && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {updateRefusal.message}
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
            <button type="button" onClick={cancelPayment} disabled={busy}>
              Confirmer l’annulation
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
              Garder l’encaissement
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
            Annuler l’encaissement
          </button>
        )}
      </p>
    </form>
  );
}
