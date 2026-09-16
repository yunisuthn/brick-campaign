import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useSale } from '../sales/useSales.js';
import { type SalePaymentForm, SalePaymentFields, toNewSalePayment } from './salePaymentFields.js';
import { useCreateSalePayment } from './useSalePayments.js';

export function NewSalePaymentPage() {
  const { id: saleId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to={`/ventes/${saleId}`}>{t('salePayments.backToSale')}</Link>
      </p>
      <h1>{t('salePayments.newTitle')}</h1>
      {campaign ? (
        <PaymentForm campaignId={campaign.id} saleId={saleId} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
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
  const { t } = useTranslation();
  const form = useForm<SalePaymentForm>({ defaultValues: { date: today(), amount: '' } });

  if (sale.isError)
    return <p role="alert">{loadErrorMessage(sale.error, t('salePayments.saleNotFound'))}</p>;
  if (!sale.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewSalePayment(values), { onSuccess: () => navigate(`/ventes/${saleId}`) }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <p role="status">
        {t('salePayments.outstandingLine', { outstanding: formatAmount(sale.data.outstanding) })}
      </p>
      <SalePaymentFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
      />
      {createRefusal.message && (
        <p role="alert">
          {t('salePayments.createFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('salePayments.submitButton')}
        </button>
      </p>
    </form>
  );
}
