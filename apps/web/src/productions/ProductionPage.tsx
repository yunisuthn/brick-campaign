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
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ProductionForm, ProductionFields, toNewProduction } from './productionFields.js';
import {
  type Production,
  useCancelProduction,
  useProduction,
  useUpdateProduction,
} from './useProductions.js';

/** A correction, in a sheet over the list it was opened from (reference document, 10.12). */
export function ProductionPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  if (!campaign) {
    return (
      <RouteSheet title={t('productions.title')} closeTo="/productions">
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      </RouteSheet>
    );
  }
  return <LoadedProduction campaign={campaign} id={id} />;
}

/** The entry, the moulders it may name (its own even if retired) and the rice fields, all before the form. */
function LoadedProduction({ campaign, id }: { campaign: Campaign; id: string }) {
  const production = useProduction(campaign.id, id);
  const moulders = useMoulders(true);
  const riceFields = useRiceFields();
  const { t } = useTranslation();

  const failure = production.isError
    ? loadErrorMessage(production.error, t('productions.notFound'))
    : [moulders, riceFields].find((query) => query.isError)?.error;
  if (failure) {
    return (
      <RouteSheet title={t('productions.title')} closeTo="/productions">
        {typeof failure === 'string' ? (
          <ErrorNote message={failure} />
        ) : (
          <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(failure)} />
        )}
      </RouteSheet>
    );
  }
  if (!production.isSuccess || !moulders.isSuccess || !riceFields.isSuccess) {
    return (
      <RouteSheet title={t('productions.title')} closeTo="/productions">
        <p role="status" className="text-muted-foreground">
          {t('common.loading')}
        </p>
      </RouteSheet>
    );
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
 * A correction sends the whole entry back; cancelling asks for a second step, then goes back
 * to the list. A cancelled entry is gone from the API, its row stays in the database
 * (reference document, section 5).
 */
function CorrectionForm({ production, moulders, riceFields, rates }: CorrectionFormProps) {
  const update = useUpdateProduction(production.campaignId, production.id);
  const cancel = useCancelProduction(production.campaignId, production.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
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
  const cancelEntry = () =>
    cancel.mutate(undefined, { onSuccess: () => void navigate('/productions') });

  const moulderName = moulders.find((m) => m.id === production.moulderId)?.name ?? '';
  const fieldName = riceFields.find((f) => f.id === production.riceFieldId)?.name;
  const period =
    production.endedOn !== null && production.endedOn !== production.startedOn
      ? `${format.date(production.startedOn)} – ${format.date(production.endedOn)}`
      : format.date(production.startedOn);
  const busy = update.isPending || cancel.isPending;

  return (
    <RouteSheet
      title={`${moulderName}, ${period}`}
      description={[fieldName, format.bricks(production.quantity)].filter(Boolean).join(' · ')}
      closeTo="/productions"
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
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
            keepLabel={t('productions.keepEntry')}
            onConfirm={cancelEntry}
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
            {t('productions.cancelEntry')}
          </Button>
        )}
      </form>
    </RouteSheet>
  );
}
