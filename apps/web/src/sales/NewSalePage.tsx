import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { DateField, NumberField, SelectField } from '@/components/fields';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote, NoCampaign } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
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

/** A new sale, in a sheet over the list (reference document, section 10.12). */
export function NewSalePage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet
      title={t('sales.newTitle')}
      description={
        campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
      }
      closeTo="/ventes"
    >
      {campaign ? (
        <SaleForm campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="sales.noCampaignSuffix" />
      )}
    </RouteSheet>
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

  if (clients.isError) {
    return (
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(clients.error)} />
    );
  }
  if (!clients.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

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
      { onSuccess: (sale) => void navigate(`/ventes/${sale.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <SelectField
        label={t('sales.clientLabel')}
        name="clientId"
        control={form.control}
        error={form.formState.errors.clientId ?? createRefusal.fields.clientId}
        rules={{ required: t('sales.clientRequired') }}
        placeholder={t('common.choose')}
        options={clients.data.map((client) => ({ value: client.id, label: client.name }))}
      />
      <DateField
        label={t('common.date')}
        name="date"
        control={form.control}
        error={form.formState.errors.date ?? createRefusal.fields.date}
        required={t('common.dateRequired')}
      />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('sales.orderedQuantityLabel')}
          error={form.formState.errors.orderedQuantity ?? createRefusal.fields.orderedQuantity}
          registration={form.register('orderedQuantity', {
            validate: (value) =>
              (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
              t('sales.quantityRequired'),
          })}
        />
        <NumberField
          label={t('sales.unitPriceLabel')}
          error={form.formState.errors.unitPrice ?? createRefusal.fields.unitPrice}
          registration={form.register('unitPrice', {
            validate: (value) =>
              (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
              t('sales.unitPriceRequired'),
          })}
        />
      </div>
      <p
        role="status"
        className="flex items-baseline justify-between gap-4 rounded-[10px] bg-tile px-4 py-3"
      >
        <span className="text-sm text-muted-foreground">{t('sales.totalLabel')}</span>{' '}
        <span className="text-xl font-bold tabular-nums">{formatAmount(total)}</span>
      </p>
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('sales.saveNewSale')} busy={create.isPending} />
    </form>
  );
}
