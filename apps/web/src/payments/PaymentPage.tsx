import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { type PaymentForm, PaymentFields, toNewPayment } from './paymentFields.js';
import {
  type Payment,
  PAYMENT_TYPE_LABELS,
  useCancelPayment,
  usePayment,
  useUpdatePayment,
} from './usePayments.js';

export function PaymentPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/versements">Tous les versements</Link>
      </p>
      {campaign ? <LoadedPayment campaignId={campaign.id} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

/** The payment, the moulders it may name (its own even if retired) and the known contractor names. */
function LoadedPayment({ campaignId, id }: { campaignId: string; id: string }) {
  const payment = usePayment(campaignId, id);
  const moulders = useMoulders(true);
  const contractors = useContractorBalances(campaignId);

  if (payment.isError) {
    return <p role="alert">{loadErrorMessage(payment.error, 'Versement introuvable.')}</p>;
  }
  const failed = [moulders, contractors].find((query) => query.isError);
  if (failed) return <p role="alert">Chargement impossible : {failed.error?.message}</p>;
  if (!payment.isSuccess || !moulders.isSuccess || !contractors.isSuccess) {
    return <p role="status">Chargement…</p>;
  }

  const choosable = moulders.data.filter((m) => m.active || m.id === payment.data.moulderId);
  return (
    <CorrectionForm
      key={payment.data.id}
      payment={payment.data}
      moulders={choosable}
      contractorNames={contractors.data.map((c) => c.contractorName)}
    />
  );
}

interface CorrectionFormProps {
  payment: Payment;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  contractorNames: ReadonlyArray<string>;
}

/**
 * A correction sends the whole payment back, beneficiary included: the API replaces one kind
 * of beneficiary with the other. Cancelling asks for a second click, then goes back to the
 * list; the row stays in the database (reference document, section 5).
 */
function CorrectionForm({ payment, moulders, contractorNames }: CorrectionFormProps) {
  const update = useUpdatePayment(payment.campaignId, payment.id);
  const cancel = useCancelPayment(payment.campaignId, payment.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<PaymentForm>({
    defaultValues: {
      date: payment.date,
      kind: payment.contractorName === null ? 'moulder' : 'contractor',
      moulderId: payment.moulderId ?? '',
      contractorName: payment.contractorName ?? '',
      type: payment.type,
      amount: String(payment.amount),
    },
  });

  const save = form.handleSubmit((values) =>
    update.mutate(toNewPayment(values), {
      onSuccess: (saved) => form.reset({ ...values, amount: String(saved.amount) }),
    }),
  );
  const cancelPayment = () =>
    cancel.mutate(undefined, { onSuccess: () => navigate('/versements') });

  const name =
    payment.contractorName ?? moulders.find((m) => m.id === payment.moulderId)?.name ?? '';
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <h1>
        {name}, {formatDate(payment.date)}
        <span style={{ display: 'block', fontSize: '1rem', fontWeight: 'normal' }}>
          {PAYMENT_TYPE_LABELS[payment.type]} · {formatAmount(payment.amount)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <PaymentFields
          register={form.register}
          watch={form.watch}
          errors={form.formState.errors}
          moulders={moulders}
          contractorNames={contractorNames}
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
              <button type="button" onClick={cancelPayment} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder le versement
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler le versement
            </button>
          )}
        </p>
      </form>
    </>
  );
}
