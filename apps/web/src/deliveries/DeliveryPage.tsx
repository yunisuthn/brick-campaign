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
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { type DeliveryForm, DeliveryFields, toNewDelivery } from './deliveryFields.js';
import {
  type Delivery,
  useCancelDelivery,
  useDelivery,
  useUpdateDelivery,
} from './useDeliveries.js';

/** A trip's correction, in a sheet over the page of its sale (reference document, 10.12). */
export function DeliveryPage() {
  const { id: saleId = '', deliveryId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  if (!campaign) {
    return (
      <RouteSheet title={t('deliveries.sectionTitle')} closeTo={`/ventes/${saleId}`}>
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      </RouteSheet>
    );
  }
  return <LoadedDelivery campaignId={campaign.id} saleId={saleId} id={deliveryId} />;
}

function LoadedDelivery({
  campaignId,
  saleId,
  id,
}: {
  campaignId: string;
  saleId: string;
  id: string;
}) {
  const delivery = useDelivery(campaignId, saleId, id);
  const { t } = useTranslation();

  if (!delivery.isSuccess) {
    return (
      <RouteSheet title={t('deliveries.sectionTitle')} closeTo={`/ventes/${saleId}`}>
        {delivery.isError ? (
          <ErrorNote message={loadErrorMessage(delivery.error, t('deliveries.notFound'))} />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </RouteSheet>
    );
  }
  return <CorrectionForm key={delivery.data.id} campaignId={campaignId} delivery={delivery.data} />;
}

/** Cancelling a trip puts its bricks back in the fired stock and moves the sale's status back. */
function CorrectionForm({ campaignId, delivery }: { campaignId: string; delivery: Delivery }) {
  const update = useUpdateDelivery(campaignId, delivery.saleId, delivery.id);
  const cancel = useCancelDelivery(campaignId, delivery.saleId, delivery.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const salePath = `/ventes/${delivery.saleId}`;
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<DeliveryForm>({
    defaultValues: {
      date: delivery.date,
      quantity: String(delivery.quantity),
      cost: String(delivery.cost),
      plate: delivery.plate ?? '',
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(toNewDelivery(values), {
      onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }),
    }),
  );
  const cancelTrip = () => cancel.mutate(undefined, { onSuccess: () => void navigate(salePath) });
  const busy = update.isPending || cancel.isPending;

  return (
    <RouteSheet
      title={format.bricks(delivery.quantity)}
      description={`${format.date(delivery.date)} · ${format.amount(delivery.cost)}`}
      closeTo={salePath}
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <DeliveryFields
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
            keepLabel={t('deliveries.keepTrip')}
            onConfirm={cancelTrip}
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
            {t('deliveries.cancelTrip')}
          </Button>
        )}
      </form>
    </RouteSheet>
  );
}
