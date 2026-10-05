import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Outlet, useNavigate, useParams } from 'react-router';
import { AmountRow } from '@/components/AmountRow';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { DateField, NumberField } from '@/components/fields';
import { ToneBadge } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { BatchWorks } from '../contractor-works/BatchWorks.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { formatCount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import {
  type KilnBatch,
  MIN_KILN_BATCH_QUANTITY,
  useCancelKilnBatch,
  useKilnBatch,
  useUpdateKilnBatch,
} from './useKilnBatches.js';

interface KilnBatchForm {
  loadedOn: string;
  unloadedOn: string;
  quantity: string;
}

export function KilnBatchPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      {campaign ? (
        <LoadedBatch campaignId={campaign.id} id={id} />
      ) : (
        <>
          <PageHeader title={t('kilnBatches.title')} back={backToList(t)} />
          <p className="text-muted-foreground">{t('kilnBatches.noCampaignShort')}</p>
        </>
      )}
      <Outlet />
    </Screen>
  );
}

function backToList(t: ReturnType<typeof useTranslation>['t']) {
  return { to: '/lots', label: t('kilnBatches.allBatches') };
}

function LoadedBatch({ campaignId, id }: { campaignId: string; id: string }) {
  const batch = useKilnBatch(campaignId, id);
  const { t } = useTranslation();

  if (!batch.isSuccess) {
    return (
      <>
        <PageHeader title={t('kilnBatches.title')} back={backToList(t)} />
        {batch.isError ? (
          <ErrorNote message={loadErrorMessage(batch.error, t('kilnBatches.notFound'), t)} />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </>
    );
  }
  return <BatchForm key={batch.data.id} batch={batch.data} />;
}

/**
 * One form for the whole batch. The unloading date is a field like the others, left empty
 * while the batch is still firing: emptying it puts the batch back in the kiln, which the API
 * allows and the stock follows at once.
 */
function BatchForm({ batch }: { batch: KilnBatch }) {
  const update = useUpdateKilnBatch(batch.campaignId, batch.id);
  const cancel = useCancelKilnBatch(batch.campaignId, batch.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<KilnBatchForm>({
    defaultValues: {
      loadedOn: batch.loadedOn,
      unloadedOn: batch.unloadedOn ?? '',
      quantity: String(batch.quantity),
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        loadedOn: values.loadedOn,
        unloadedOn: values.unloadedOn === '' ? null : values.unloadedOn,
        quantity: Number(digitsOnly(values.quantity)),
      },
      { onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }) },
    ),
  );
  const cancelBatch = () => cancel.mutate(undefined, { onSuccess: () => void navigate('/lots') });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <PageHeader
        title={format.bricks(batch.quantity)}
        subtitle={`${t('kilnBatches.loadedOnMessage', { date: format.date(batch.loadedOn) })} · ${
          batch.unloadedOn === null
            ? t('kilnBatches.stillInKiln')
            : t('kilnBatches.unloadedOnMessage', { date: format.date(batch.unloadedOn) })
        }`}
        back={backToList(t)}
        action={
          <ToneBadge tone={batch.unloadedOn === null ? 'warning' : 'brick'}>
            {t(batch.unloadedOn === null ? 'dashboard.stock.inKiln' : 'dashboard.stock.fired')}
          </ToneBadge>
        }
      />
      <Cost cost={batch.cost} />
      <BatchWorks campaignId={batch.campaignId} batchId={batch.id} />
      <SectionCard title={t('common.edit')}>
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label={t('kilnBatches.loadedOnLabel')}
              name="loadedOn"
              control={form.control}
              error={form.formState.errors.loadedOn ?? updateRefusal.fields.loadedOn}
              required={t('kilnBatches.loadedOnRequired')}
            />
            <DateField
              label={t('kilnBatches.unloadedOnLabel')}
              name="unloadedOn"
              control={form.control}
              error={form.formState.errors.unloadedOn ?? updateRefusal.fields.unloadedOn}
            />
            <p className="col-span-2 -mt-1 text-sm text-muted-foreground">
              {t('kilnBatches.unloadedOnHint')}
            </p>
          </div>
          <NumberField
            label={t('kilnBatches.quantityLabel')}
            error={form.formState.errors.quantity ?? updateRefusal.fields.quantity}
            registration={form.register('quantity', {
              validate: (value) =>
                (/^\d+$/.test(digitsOnly(value)) &&
                  Number(digitsOnly(value)) >= MIN_KILN_BATCH_QUANTITY) ||
                t('kilnBatches.quantityRequired', {
                  min: formatCount(MIN_KILN_BATCH_QUANTITY),
                }),
            })}
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
              keepLabel={t('kilnBatches.keepBatch')}
              onConfirm={cancelBatch}
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
              {t('kilnBatches.cancelBatch')}
            </Button>
          )}
        </form>
      </SectionCard>
    </>
  );
}

/** Linked expenses plus the works of the batch at their campaign rates. */
function Cost({ cost }: { cost: KilnBatch['cost'] }) {
  const { t } = useTranslation();
  const toFix = t('kilnBatches.rateToFixShort');
  return (
    <SectionCard title={t('kilnBatches.costSectionLabel')}>
      <dl>
        <AmountRow label={t('kilnBatches.expensesLabel')} value={cost.expenses} />
        <AmountRow label={t('kilnBatches.labourLabel')} value={cost.labour} unknownLabel={toFix} />
      </dl>
      <Separator className="my-2" />
      <dl>
        <AmountRow
          label={t('kilnBatches.totalLabel')}
          value={cost.total}
          unknownLabel={toFix}
          strong
        />
      </dl>
    </SectionCard>
  );
}
