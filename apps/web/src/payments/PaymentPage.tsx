import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import {
  PAYMENT_TYPE_KEY,
  type PaymentForm,
  PaymentFields,
  toNewPayment,
} from './paymentFields.js';
import { type Payment, useCancelPayment, usePayment, useUpdatePayment } from './usePayments.js';

export function PaymentPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/versements">{t('payments.allPayments')}</Link>
      </p>
      {campaign ? (
        <LoadedPayment campaignId={campaign.id} id={id} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </main>
  );
}

/** The payment, the moulders it may name (its own even if retired) and the known contractor names. */
function LoadedPayment({ campaignId, id }: { campaignId: string; id: string }) {
  const payment = usePayment(campaignId, id);
  const moulders = useMoulders(true);
  const contractors = useContractorBalances(campaignId);
  const { t } = useTranslation();

  if (payment.isError) {
    return <p role="alert">{loadErrorMessage(payment.error, t('payments.notFound'))}</p>;
  }
  const failed = [moulders, contractors].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!payment.isSuccess || !moulders.isSuccess || !contractors.isSuccess) {
    return <p role="status">{t('common.loading')}</p>;
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

  const updateRefusal = apiFormErrors(update, form);

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
  const { t } = useTranslation();

  return (
    <>
      <h1>
        {name}, {formatDate(payment.date)}
        <span className="title-sub">
          {t(PAYMENT_TYPE_KEY[payment.type])} · {formatAmount(payment.amount)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <PaymentFields
          register={form.register}
          watch={form.watch}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          moulders={moulders}
          contractorNames={contractorNames}
        />
        {updateRefusal.message && (
          <p role="alert">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        {cancel.isError && (
          <p role="alert">
            {t('common.cancelFailedPrefix')} {apiErrorMessage(cancel.error)}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            {t('common.save')}
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelPayment} disabled={busy}>
                {t('common.confirmCancellation')}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                {t('payments.keepPayment')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              {t('payments.cancelPayment')}
            </button>
          )}
        </p>
      </form>
    </>
  );
}
