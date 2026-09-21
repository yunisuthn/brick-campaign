import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
import { DateField } from '../form/DateField.js';
import { Field, SelectField } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatAmount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useCreateSale } from './useSales.js';

interface SaleForm {
  clientId: string;
  date: string;
  orderedQuantity: string;
  unitPrice: string;
}

export function NewSalePage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/ventes">{t('sales.allSales')}</Link>
      </p>
      <h1>{t('sales.newTitle')}</h1>
      {campaign ? (
        <SaleForm campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('sales.noCampaignSuffix')}
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
  const { t } = useTranslation();
  const form = useForm<SaleForm>({
    defaultValues: { clientId: '', date: today(), orderedQuantity: '', unitPrice: '' },
  });

  if (clients.isError)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(clients.error)}
      </p>
    );
  if (!clients.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const quantity = Number(digitsOnly(form.watch('orderedQuantity')));
  const price = Number(digitsOnly(form.watch('unitPrice')));
  const total = Number.isFinite(quantity * price) ? quantity * price : 0;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        clientId: values.clientId,
        date: values.date,
        orderedQuantity: Number(digitsOnly(values.orderedQuantity)),
        unitPrice: Number(digitsOnly(values.unitPrice)),
      },
      { onSuccess: (sale) => navigate(`/ventes/${sale.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <SelectField
        label={t('sales.clientLabel')}
        error={form.formState.errors.clientId ?? createRefusal.fields.clientId}
        name="clientId"
        control={form.control}
        rules={{ required: t('sales.clientRequired') }}
        options={[
          { value: '', label: t('common.choose') },
          ...clients.data.map((client) => ({ value: client.id, label: client.name })),
        ]}
      />
      <DateField
        label={t('common.date')}
        name="date"
        control={form.control}
        error={form.formState.errors.date ?? createRefusal.fields.date}
        required={t('common.dateRequired')}
      />
      <Field
        label={t('sales.orderedQuantityLabel')}
        error={form.formState.errors.orderedQuantity ?? createRefusal.fields.orderedQuantity}
        input={form.register('orderedQuantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('sales.quantityRequired'),
        })}
        inputMode="numeric"
      />
      <Field
        label={t('sales.unitPriceLabel')}
        error={form.formState.errors.unitPrice ?? createRefusal.fields.unitPrice}
        input={form.register('unitPrice', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
            t('sales.unitPriceRequired'),
        })}
        inputMode="numeric"
      />
      <p role="status">
        {t('sales.totalLabel')} {formatAmount(total)}
      </p>
      {createRefusal.message && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('sales.saveNewSale')}
        </button>
      </p>
    </form>
  );
}
