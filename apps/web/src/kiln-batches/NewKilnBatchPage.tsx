import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { DateField, NumberField } from '@/components/fields';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote, NoCampaign } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatCount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useStock } from '../stock/useStock.js';
import { MIN_KILN_BATCH_QUANTITY, useCreateKilnBatch } from './useKilnBatches.js';

interface KilnBatchForm {
  loadedOn: string;
  quantity: string;
}

/** Loading a batch, in a sheet over the list (reference document, section 10.12). */
export function NewKilnBatchPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet title={t('kilnBatches.newTitle')} closeTo="/lots">
      {campaign ? (
        <LoadForm campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="kilnBatches.noCampaignSuffix" />
      )}
    </RouteSheet>
  );
}

/**
 * The raw stock is shown above the quantity: the API refuses to load more than what was
 * moulded, and knowing the figure beforehand saves a round trip. The minimum of 40 000 bricks
 * is the rule of section 1; the API keeps it too.
 */
function LoadForm({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const create = useCreateKilnBatch(campaignId);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<KilnBatchForm>({ defaultValues: { loadedOn: today(), quantity: '' } });

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
    create.mutate(
      {
        loadedOn: values.loadedOn,
        unloadedOn: null,
        quantity: Number(digitsOnly(values.quantity)),
      },
      { onSuccess: (batch) => void navigate(`/lots/${batch.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p role="status" className="rounded-[10px] bg-tile px-4 py-3 text-sm tabular-nums">
        {t('kilnBatches.rawStock', { quantity: format.bricks(stock.data.raw) })}
      </p>
      <DateField
        label={t('kilnBatches.loadedOnLabel')}
        name="loadedOn"
        control={form.control}
        error={form.formState.errors.loadedOn ?? createRefusal.fields.loadedOn}
        required={t('common.dateRequired')}
      />
      <NumberField
        label={t('kilnBatches.quantityLabel')}
        error={form.formState.errors.quantity ?? createRefusal.fields.quantity}
        registration={form.register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) &&
              Number(digitsOnly(value)) >= MIN_KILN_BATCH_QUANTITY) ||
            t('kilnBatches.quantityRequired', { min: formatCount(MIN_KILN_BATCH_QUANTITY) }),
        })}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('kilnBatches.loadFailedAction')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('kilnBatches.loadAction')} busy={create.isPending} />
    </form>
  );
}
