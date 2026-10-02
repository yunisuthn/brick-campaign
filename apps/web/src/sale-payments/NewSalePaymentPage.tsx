import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useSale } from '../sales/useSales.js';
import { type SalePaymentForm, SalePaymentFields, toNewSalePayment } from './salePaymentFields.js';
import { useCreateSalePayment } from './useSalePayments.js';

/** A new instalment, in a sheet over the page of its sale (reference document, 10.12). */
export function NewSalePaymentPage() {
  const { id: saleId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet title={t('salePayments.newTitle')} closeTo={`/ventes/${saleId}`}>
      {campaign ? (
        <PaymentForm campaignId={campaign.id} saleId={saleId} />
      ) : (
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      )}
    </RouteSheet>
  );
}

/**
 * What is left to pay is shown above the amount: a client settling the whole rest is the
 * common case, and the API refuses anything above it anyway.
 */
function PaymentForm({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const sale = useSale(campaignId, saleId);
  const create = useCreateSalePayment(campaignId, saleId);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<SalePaymentForm>({ defaultValues: { date: today(), amount: '' } });

  if (sale.isError) {
    return <ErrorNote message={loadErrorMessage(sale.error, t('salePayments.saleNotFound'), t)} />;
  }
  if (!sale.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewSalePayment(values), {
      onSuccess: () => void navigate(`/ventes/${saleId}`),
    }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p role="status" className="rounded-[10px] bg-tile px-4 py-3 text-sm tabular-nums">
        {t('salePayments.outstandingLine', { outstanding: format.amount(sale.data.outstanding) })}
      </p>
      <SalePaymentFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('salePayments.createFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('salePayments.submitButton')} busy={create.isPending} />
    </form>
  );
}
