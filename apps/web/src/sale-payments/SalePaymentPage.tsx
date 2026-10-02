import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { RouteSheet } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useSale } from '../sales/useSales.js';
import { type SalePaymentForm, SalePaymentFields } from './salePaymentFields.js';
import {
  type SalePayment,
  useCancelSalePayment,
  useSalePayment,
  useUpdateSalePayment,
} from './useSalePayments.js';

/** An instalment's correction, in a sheet over the page of its sale (reference document, 10.12). */
export function SalePaymentPage() {
  const { id: saleId = '', paymentId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet title={t('salePayments.title')} closeTo={`/ventes/${saleId}`}>
      {campaign ? (
        <Loaded campaignId={campaign.id} saleId={saleId} id={paymentId} />
      ) : (
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      )}
    </RouteSheet>
  );
}

function Loaded({ campaignId, saleId, id }: { campaignId: string; saleId: string; id: string }) {
  const payment = useSalePayment(campaignId, saleId, id);
  const sale = useSale(campaignId, saleId);
  const { t } = useTranslation();

  if (payment.isError) {
    return <ErrorNote message={loadErrorMessage(payment.error, t('salePayments.notFound'))} />;
  }
  if (sale.isError) {
    return <ErrorNote message={loadErrorMessage(sale.error, t('salePayments.saleNotFound'))} />;
  }
  if (!payment.isSuccess || !sale.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

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
  const format = useFormat();
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
    cancel.mutate(undefined, { onSuccess: () => void navigate(`/ventes/${saleId}`) });
  const busy = update.isPending || cancel.isPending;

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <p role="status" className="rounded-[10px] bg-tile px-4 py-3 text-sm tabular-nums">
        {t('salePayments.ceilingLine', { ceiling: format.amount(ceiling) })}
      </p>
      <SalePaymentFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...updateRefusal.fields }}
      />
      {updateRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {updateRefusal.message}
        </p>
      )}
      {cancel.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.cancelFailedPrefix')} {apiErrorMessage(cancel.error)}
        </p>
      )}
      <Button type="submit" disabled={busy || !form.formState.isDirty}>
        {t('common.save')}
      </Button>
      {confirming ? (
        <ConfirmStrip
          confirmLabel={t('common.confirmCancellation')}
          keepLabel={t('salePayments.keepPayment')}
          onConfirm={cancelPayment}
          onKeep={() => setConfirming(false)}
          busy={busy}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirming(true)}
          disabled={busy}
        >
          {t('salePayments.cancelPayment')}
        </Button>
      )}
    </form>
  );
}
