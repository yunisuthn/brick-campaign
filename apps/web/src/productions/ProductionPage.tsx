import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ProductionForm, ProductionFields, toNewProduction } from './productionFields.js';
import {
  type Production,
  useCancelProduction,
  useProduction,
  useUpdateProduction,
} from './useProductions.js';

export function ProductionPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/productions">{t('productions.allProductions')}</Link>
      </p>
      {campaign ? (
        <LoadedProduction campaign={campaign} id={id} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </main>
  );
}

/** The entry, the moulders it may name (its own even if retired) and the rice fields, all before the form. */
function LoadedProduction({ campaign, id }: { campaign: Campaign; id: string }) {
  const production = useProduction(campaign.id, id);
  const moulders = useMoulders(true);
  const riceFields = useRiceFields();
  const { t } = useTranslation();

  if (production.isError) {
    return <p role="alert">{loadErrorMessage(production.error, t('productions.notFound'))}</p>;
  }
  const failed = [moulders, riceFields].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!production.isSuccess || !moulders.isSuccess || !riceFields.isSuccess) {
    return <p role="status">{t('common.loading')}</p>;
  }

  const choosable = moulders.data.filter((m) => m.active || m.id === production.data.moulderId);
  return (
    <CorrectionForm
      key={production.data.id}
      production={production.data}
      moulders={choosable}
      riceFields={riceFields.data}
      rates={campaign.mouldingRates}
    />
  );
}

interface CorrectionFormProps {
  production: Production;
  moulders: ReadonlyArray<{ id: string; name: string }>;
  riceFields: ReadonlyArray<{ id: string; name: string }>;
  rates: ReadonlyArray<number>;
}

/**
 * A correction sends the whole entry back; cancelling asks for a second click, then goes back
 * to the list. A cancelled entry is gone from the API, its row stays in the database
 * (reference document, section 5).
 */
function CorrectionForm({ production, moulders, riceFields, rates }: CorrectionFormProps) {
  const update = useUpdateProduction(production.campaignId, production.id);
  const cancel = useCancelProduction(production.campaignId, production.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ProductionForm>({
    defaultValues: {
      startedOn: production.startedOn,
      endedOn: production.endedOn ?? '',
      moulderId: production.moulderId,
      riceFieldId: production.riceFieldId,
      quantity: String(production.quantity),
      rate: production.rate === null ? '' : String(production.rate),
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(toNewProduction(values), {
      onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }),
    }),
  );
  const cancelEntry = () => cancel.mutate(undefined, { onSuccess: () => navigate('/productions') });

  const moulderName = moulders.find((m) => m.id === production.moulderId)?.name ?? '';
  const busy = update.isPending || cancel.isPending;
  const { t } = useTranslation();

  return (
    <>
      <h1>
        {moulderName}, {formatDate(production.startedOn)}
        {production.endedOn !== null && production.endedOn !== production.startedOn && (
          <> – {formatDate(production.endedOn)}</>
        )}
        <span className="title-sub">{formatBricks(production.quantity)}</span>
      </h1>
      <form onSubmit={save} noValidate>
        <ProductionFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          moulders={moulders}
          riceFields={riceFields}
          rates={rates}
          showEndedOn
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
              <button type="button" onClick={cancelEntry} disabled={busy}>
                {t('common.confirmCancellation')}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                {t('productions.keepEntry')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              {t('productions.cancelEntry')}
            </button>
          )}
        </p>
      </form>
    </>
  );
}
