import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote, NoCampaign } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ProductionForm, ProductionFields, toNewProduction } from './productionFields.js';
import { useCreateProduction } from './useProductions.js';

/** A new entry, in a sheet over the list (reference document, section 10.12). */
export function NewProductionPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet
      title={t('productions.newTitle')}
      description={
        campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
      }
      closeTo="/productions"
    >
      {campaign ? (
        <EntryForm campaign={campaign} />
      ) : (
        <NoCampaign suffix="productions.noCampaignSuffix" />
      )}
    </RouteSheet>
  );
}

/**
 * Entries run through the moulders one after the other: after a save the form stays, keeps the
 * date, the rice field and the rate, clears the moulder and the quantity, and says what was just
 * saved. Only active moulders are offered.
 */
function EntryForm({ campaign }: { campaign: Campaign }) {
  const moulders = useMoulders();
  const riceFields = useRiceFields();
  const create = useCreateProduction(campaign.id);
  const [saved, setSaved] = useState<string | null>(null);
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<ProductionForm>({
    defaultValues: {
      startedOn: today(),
      endedOn: '',
      moulderId: '',
      riceFieldId: '',
      quantity: '',
      rate: '',
    },
  });

  if (moulders.isError || riceFields.isError) {
    const error = moulders.error ?? riceFields.error;
    return (
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={error && apiErrorMessage(error)} />
    );
  }
  if (!moulders.isSuccess || !riceFields.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewProduction(values), {
      onSuccess: (production) => {
        const name = moulders.data.find((m) => m.id === production.moulderId)?.name ?? '';
        setSaved(
          t('productions.savedMessage', { name, quantity: format.bricks(production.quantity) }),
        );
        form.reset({ ...values, moulderId: '', quantity: '' });
        form.setFocus('moulderId');
      },
    }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ProductionFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        moulders={moulders.data}
        riceFields={riceFields.data}
        rates={campaign.mouldingRates}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      {saved && !create.isError && (
        <p
          role="status"
          className="rounded-[10px] bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {saved}
        </p>
      )}
      <SheetActions submitLabel={t('common.save')} busy={create.isPending} />
    </form>
  );
}
