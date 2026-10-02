import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useStock } from '../stock/useStock.js';
import { type DeliveryForm, DeliveryFields, toNewDelivery } from './deliveryFields.js';
import { useCreateDelivery } from './useDeliveries.js';

/** A new trip, in a sheet over the page of its sale (reference document, section 10.12). */
export function NewDeliveryPage() {
  const { id: saleId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet title={t('deliveries.newTitle')} closeTo={`/ventes/${saleId}`}>
      {campaign ? (
        <TripForm campaignId={campaign.id} saleId={saleId} />
      ) : (
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      )}
    </RouteSheet>
  );
}

/**
 * The fired stock is shown above the quantity: the API refuses to deliver more bricks than
 * came out of the kiln, and knowing the figure beforehand saves a round trip.
 */
function TripForm({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const stock = useStock(campaignId);
  const create = useCreateDelivery(campaignId, saleId);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<DeliveryForm>({
    defaultValues: { date: today(), quantity: '', cost: '', plate: '' },
  });

  if (stock.isError) {
    return (
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(stock.error)} />
    );
  }
  if (!stock.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewDelivery(values), {
      onSuccess: () => void navigate(`/ventes/${saleId}`),
    }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p role="status" className="rounded-[10px] bg-tile px-4 py-3 text-sm tabular-nums">
        {t('deliveries.firedStockLine', { stock: format.bricks(stock.data.fired) })}
      </p>
      <DeliveryFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('deliveries.saveTrip')} busy={create.isPending} />
    </form>
  );
}
