import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { DateField } from '../form/DateField.js';
import { Field } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatBricks, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useStock } from '../stock/useStock.js';
import { MIN_KILN_BATCH_QUANTITY, useCreateKilnBatch } from './useKilnBatches.js';

interface KilnBatchForm {
  loadedOn: string;
  quantity: string;
}

export function NewKilnBatchPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/lots">{t('kilnBatches.allBatches')}</Link>
      </p>
      <h1>{t('kilnBatches.newTitle')}</h1>
      {campaign ? (
        <LoadForm campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('kilnBatches.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

/**
 * The raw stock is shown beside the quantity: the API refuses to load more than what was
 * moulded, and knowing the figure beforehand saves a round trip. The minimum of 40 000 bricks
 * is the rule of section 1; the API keeps it too.
 */
function LoadForm({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const create = useCreateKilnBatch(campaignId);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<KilnBatchForm>({ defaultValues: { loadedOn: today(), quantity: '' } });

  if (stock.isError)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(stock.error)}
      </p>
    );
  if (!stock.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        loadedOn: values.loadedOn,
        unloadedOn: null,
        quantity: Number(digitsOnly(values.quantity)),
      },
      { onSuccess: (batch) => navigate(`/lots/${batch.id}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <p role="status">{t('kilnBatches.rawStock', { quantity: formatBricks(stock.data.raw) })}</p>
      <DateField
        label={t('kilnBatches.loadedOnLabel')}
        name="loadedOn"
        control={form.control}
        error={form.formState.errors.loadedOn ?? createRefusal.fields.loadedOn}
        required={t('common.dateRequired')}
      />
      <Field
        label={t('kilnBatches.quantityLabel')}
        error={form.formState.errors.quantity ?? createRefusal.fields.quantity}
        input={form.register('quantity', {
          validate: (value) =>
            (/^\d+$/.test(digitsOnly(value)) &&
              Number(digitsOnly(value)) >= MIN_KILN_BATCH_QUANTITY) ||
            t('kilnBatches.quantityRequired', {
              min: MIN_KILN_BATCH_QUANTITY.toLocaleString('fr-FR'),
            }),
        })}
        inputMode="numeric"
      />
      {createRefusal.message && (
        <p role="alert">
          {t('kilnBatches.loadFailedAction')} {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('kilnBatches.loadAction')}
        </button>
      </p>
    </form>
  );
}
