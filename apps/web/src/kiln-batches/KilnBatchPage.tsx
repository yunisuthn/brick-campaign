import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { BatchWorks } from '../contractor-works/BatchWorks.js';
import { DateField } from '../form/DateField.js';
import { Field } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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
    <main className="page">
      <p>
        <Link to="/lots">{t('kilnBatches.allBatches')}</Link>
      </p>
      {campaign ? (
        <LoadedBatch campaignId={campaign.id} id={id} />
      ) : (
        <p>{t('kilnBatches.noCampaignShort')}</p>
      )}
    </main>
  );
}

function LoadedBatch({ campaignId, id }: { campaignId: string; id: string }) {
  const batch = useKilnBatch(campaignId, id);
  const { t } = useTranslation();

  if (batch.isError) {
    return <p role="alert">{loadErrorMessage(batch.error, t('kilnBatches.notFound'))}</p>;
  }
  if (!batch.isSuccess) return <p role="status">{t('common.loading')}</p>;
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
  const cancelBatch = () => cancel.mutate(undefined, { onSuccess: () => navigate('/lots') });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <h1>
        {formatBricks(batch.quantity)}
        <span className="title-sub">
          {t('kilnBatches.loadedOnMessage', { date: formatDate(batch.loadedOn) })} ·{' '}
          {batch.unloadedOn === null
            ? t('kilnBatches.stillInKiln')
            : t('kilnBatches.unloadedOnMessage', { date: formatDate(batch.unloadedOn) })}
        </span>
      </h1>
      <Cost cost={batch.cost} />
      <BatchWorks campaignId={batch.campaignId} batchId={batch.id} />
      <form onSubmit={save} noValidate>
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
        <p className="sub">{t('kilnBatches.unloadedOnHint')}</p>
        <Field
          label={t('kilnBatches.quantityLabel')}
          error={form.formState.errors.quantity ?? updateRefusal.fields.quantity}
          input={form.register('quantity', {
            validate: (value) =>
              (/^\d+$/.test(digitsOnly(value)) &&
                Number(digitsOnly(value)) >= MIN_KILN_BATCH_QUANTITY) ||
              t('kilnBatches.quantityRequired', { min: MIN_KILN_BATCH_QUANTITY.toLocaleString('fr-FR') }),
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
              <button type="button" onClick={cancelBatch} disabled={busy}>
                {t('common.confirmCancellation')}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                {t('kilnBatches.keepBatch')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              {t('kilnBatches.cancelBatch')}
            </button>
          )}
        </p>
      </form>
    </>
  );
}

/** Linked expenses plus the works of the batch at their campaign rates. */
function Cost({ cost }: { cost: KilnBatch['cost'] }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t('kilnBatches.costSectionLabel')}>
      <dl className="facts">
        <dt>{t('kilnBatches.expensesLabel')}</dt>
        <dd>{formatAmount(cost.expenses)}</dd>
        <dt>{t('kilnBatches.labourLabel')}</dt>
        <dd>{cost.labour === null ? <em>{t('kilnBatches.rateToFixShort')}</em> : formatAmount(cost.labour)}</dd>
        <dt>{t('kilnBatches.totalLabel')}</dt>
        <dd className="strong">
          {cost.total === null ? <em>{t('kilnBatches.rateToFixShort')}</em> : formatAmount(cost.total)}
        </dd>
      </dl>
    </section>
  );
}
