import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { type Client, useClients } from '../clients/useClients.js';
import { SaleDeliveries } from '../deliveries/SaleDeliveries.js';
import { DateField } from '../form/DateField.js';
import { Field, SelectField } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { SalePayments } from '../sale-payments/SalePayments.js';
import { type Sale, SALE_STATUS_KEY, useCancelSale, useSale, useUpdateSale } from './useSales.js';

interface SaleForm {
  clientId: string;
  date: string;
  orderedQuantity: string;
  unitPrice: string;
}

export function SalePage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/ventes">{t('sales.allSales')}</Link>
      </p>
      {campaign ? (
        <LoadedSale campaignId={campaign.id} id={id} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </main>
  );
}

function LoadedSale({ campaignId, id }: { campaignId: string; id: string }) {
  const sale = useSale(campaignId, id);
  const clients = useClients();
  const { t } = useTranslation();

  if (sale.isError) return <p role="alert">{loadErrorMessage(sale.error, t('sales.notFound'))}</p>;
  if (clients.isError)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(clients.error)}
      </p>
    );
  if (!sale.isSuccess || !clients.isSuccess) return <p role="status">{t('common.loading')}</p>;

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
  const { t } = useTranslation();
  const name =
    clients.find((client) => client.id === sale.clientId)?.name ?? t('sales.unknownClient');
  return (
    <h1>
      {name}
      <span className="title-sub">
        {formatDate(sale.date)} · {t(SALE_STATUS_KEY[sale.status])} · {formatAmount(sale.total)}
      </span>
      <span className="title-sub">
        {t('sales.deliveredOfOrdered', {
          delivered: formatBricks(sale.deliveredQuantity),
          ordered: formatBricks(sale.orderedQuantity),
        })}
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
  const { t } = useTranslation();
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
        orderedQuantity: Number(digitsOnly(values.orderedQuantity)),
        unitPrice: Number(digitsOnly(values.unitPrice)),
      },
      { onSuccess: (saved) => form.reset({ ...values, unitPrice: String(saved.unitPrice) }) },
    ),
  );
  const cancelSale = () => cancel.mutate(undefined, { onSuccess: () => navigate('/ventes') });
  const busy = update.isPending || cancel.isPending;

  return (
    <form onSubmit={save} noValidate>
      <SelectField
        label={t('sales.clientLabel')}
        error={form.formState.errors.clientId ?? updateRefusal.fields.clientId}
        name="clientId"
        control={form.control}
        rules={{ required: t('sales.clientRequired') }}
        options={clients.map((client) => ({ value: client.id, label: client.name }))}
      />
      <DateField
        label={t('common.date')}
        name="date"
        control={form.control}
        error={form.formState.errors.date ?? updateRefusal.fields.date}
        required={t('common.dateRequired')}
      />
      <Field
        label={t('sales.orderedQuantityLabel')}
        error={form.formState.errors.orderedQuantity ?? updateRefusal.fields.orderedQuantity}
        input={form.register('orderedQuantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('sales.quantityRequired'),
        })}
        inputMode="numeric"
      />
      <Field
        label={t('sales.unitPriceLabel')}
        error={form.formState.errors.unitPrice ?? updateRefusal.fields.unitPrice}
        input={form.register('unitPrice', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('sales.unitPriceRequired'),
        })}
        inputMode="numeric"
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
            <button type="button" onClick={cancelSale} disabled={busy}>
              {t('common.confirmCancellation')}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
              {t('sales.keepSale')}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
            {t('sales.cancelSale')}
          </button>
        )}
      </p>
    </form>
  );
}
