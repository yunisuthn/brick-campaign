import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Outlet, useNavigate, useParams } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { DateField, NumberField, SelectField } from '@/components/fields';
import { Meter, ToneBadge } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { type Client, useClients } from '../clients/useClients.js';
import { SaleDeliveries } from '../deliveries/SaleDeliveries.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { SalePayments } from '../sale-payments/SalePayments.js';
import {
  type Sale,
  SALE_STATUS_KEY,
  SALE_STATUS_TONE,
  useCancelSale,
  useSale,
  useUpdateSale,
} from './useSales.js';

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
    <Screen>
      {campaign ? (
        <LoadedSale campaignId={campaign.id} id={id} />
      ) : (
        <>
          <PageHeader
            title={t('sales.title')}
            back={{ to: '/ventes', label: t('sales.allSales') }}
          />
          <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
        </>
      )}
      <Outlet />
    </Screen>
  );
}

/**
 * The sale, then its trips and what came in, then the form that corrects it. A trip and an
 * instalment open in a sheet over this page, through the child routes in the outlet.
 */
function LoadedSale({ campaignId, id }: { campaignId: string; id: string }) {
  const sale = useSale(campaignId, id);
  const clients = useClients();
  const { t } = useTranslation();
  const back = { to: '/ventes', label: t('sales.allSales') };

  if (sale.isError) {
    return (
      <>
        <PageHeader title={t('sales.title')} back={back} />
        <ErrorNote message={loadErrorMessage(sale.error, t('sales.notFound'), t)} />
      </>
    );
  }
  if (clients.isError) {
    return (
      <>
        <PageHeader title={t('sales.title')} back={back} />
        <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(clients.error)} />
      </>
    );
  }
  if (!sale.isSuccess || !clients.isSuccess) {
    return (
      <>
        <PageHeader title={t('sales.title')} back={back} />
        <p role="status" className="text-muted-foreground">
          {t('common.loading')}
        </p>
      </>
    );
  }

  const name =
    clients.data.find((client) => client.id === sale.data.clientId)?.name ??
    t('sales.unknownClient');
  return (
    <>
      <PageHeader title={name} back={back} />
      <SaleSummary sale={sale.data} />
      <SaleDeliveries campaignId={campaignId} saleId={sale.data.id} />
      <SalePayments sale={sale.data} />
      <SaleForm key={sale.data.id} sale={sale.data} clients={clients.data} />
    </>
  );
}

/** The date and the status, the total large, and how much of the order has left the yard. */
function SaleSummary({ sale }: { sale: Sale }) {
  const { t } = useTranslation();
  const format = useFormat();
  return (
    <Card className="gap-3.5 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{format.date(sale.date)}</span>
        <ToneBadge tone={SALE_STATUS_TONE[sale.status]}>
          {t(SALE_STATUS_KEY[sale.status])}
        </ToneBadge>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {format.amount(sale.total)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {format.bricks(sale.orderedQuantity)} × {format.amount(sale.unitPrice)}
        </p>
      </div>
      <Meter
        ratio={sale.orderedQuantity === 0 ? 0 : sale.deliveredQuantity / sale.orderedQuantity}
        className={sale.deliveredQuantity >= sale.orderedQuantity ? undefined : 'bg-stock-kiln'}
      />
      <p className="-mt-1 text-sm tabular-nums">
        {t('sales.deliveredOfOrdered', {
          delivered: format.bricks(sale.deliveredQuantity),
          ordered: format.bricks(sale.orderedQuantity),
        })}
      </p>
    </Card>
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
  const cancelSale = () => cancel.mutate(undefined, { onSuccess: () => void navigate('/ventes') });
  const busy = update.isPending || cancel.isPending;

  return (
    <SectionCard title={t('common.edit')}>
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <SelectField
          label={t('sales.clientLabel')}
          name="clientId"
          control={form.control}
          error={form.formState.errors.clientId ?? updateRefusal.fields.clientId}
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
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t('sales.orderedQuantityLabel')}
            error={form.formState.errors.orderedQuantity ?? updateRefusal.fields.orderedQuantity}
            registration={form.register('orderedQuantity', {
              validate: (value) =>
                (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
                t('sales.quantityRequired'),
            })}
          />
          <NumberField
            label={t('sales.unitPriceLabel')}
            error={form.formState.errors.unitPrice ?? updateRefusal.fields.unitPrice}
            registration={form.register('unitPrice', {
              validate: (value) =>
                (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
                t('sales.unitPriceRequired'),
            })}
          />
        </div>
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
            keepLabel={t('sales.keepSale')}
            onConfirm={cancelSale}
            onKeep={() => setConfirming(false)}
            busy={busy}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            {t('sales.cancelSale')}
          </Button>
        )}
      </form>
    </SectionCard>
  );
}
