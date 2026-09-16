import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatAmount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to={`/ventes/${saleId}`}>{t('salePayments.backToSale')}</Link>
      </p>
      <h1>{t('salePayments.title')}</h1>
      {campaign ? (
        <Loaded campaignId={campaign.id} saleId={saleId} id={paymentId} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </main>
  );
}

function Loaded({ campaignId, saleId, id }: { campaignId: string; saleId: string; id: string }) {
  const payment = useSalePayment(campaignId, saleId, id);
  const sale = useSale(campaignId, saleId);
  const { t } = useTranslation();

  if (payment.isError) {
    return <p role="alert">{loadErrorMessage(payment.error, t('salePayments.notFound'))}</p>;
  }
  if (sale.isError)
    return <p role="alert">{loadErrorMessage(sale.error, t('salePayments.saleNotFound'))}</p>;
  if (!payment.isSuccess || !sale.isSuccess) return <p role="status">{t('common.loading')}</p>;

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
  const { t } = useTranslation();
  const form = useForm<SalePaymentForm>({
    defaultValues: { date: payment.date, amount: String(payment.amount) },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      { date: values.date, amount: Number(digitsOnly(values.amount)) },
      { onSuccess: (saved) => form.reset({ date: saved.date, amount: String(saved.amount) }) },
    ),
  );
  const cancelPayment = () =>
    cancel.mutate(undefined, { onSuccess: () => navigate(`/ventes/${saleId}`) });
  const busy = update.isPending || cancel.isPending;

  return (
    <form onSubmit={save} noValidate>
      <p role="status">{t('salePayments.ceilingLine', { ceiling: formatAmount(ceiling) })}</p>
      <SalePaymentFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...updateRefusal.fields }}
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
              {t('salePayments.keepPayment')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
            {t('salePayments.cancelPayment')}
          </button>
        )}
      </p>
    </form>
  );
}
