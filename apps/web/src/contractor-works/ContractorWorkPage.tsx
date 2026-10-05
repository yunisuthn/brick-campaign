import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { RouteSheet } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import {
  type ContractorWorkForm,
  ContractorWorkFields,
  WORK_TYPE_KEY,
} from './contractorWorkFields.js';
import {
  type ContractorWork,
  type ContractorWorkType,
  useCancelContractorWork,
  useContractorWork,
  useUpdateContractorWork,
} from './useContractorWorks.js';

/**
 * A work's correction, in a sheet over the page of its batch (reference document, 10.12). The
 * address is the batch's own (`/lots/:id/prestations/:workId`); the older `/prestations/:id`
 * still opens it, with nothing behind.
 */
export function ContractorWorkPage() {
  const { id = '', workId } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();
  const batchPath = workId === undefined ? '/lots' : `/lots/${id}`;

  if (!campaign) {
    return (
      <RouteSheet title={t('contractorWorks.sectionTitle')} closeTo={batchPath}>
        <p className="text-muted-foreground">{t('contractorWorks.noCampaignShort')}</p>
      </RouteSheet>
    );
  }
  return <LoadedWork campaign={campaign} id={workId ?? id} closeTo={batchPath} />;
}

function LoadedWork({
  campaign,
  id,
  closeTo,
}: {
  campaign: Campaign;
  id: string;
  closeTo: string;
}) {
  const work = useContractorWork(campaign.id, id);
  const contractors = useContractorBalances(campaign.id);
  const { t } = useTranslation();

  if (!work.isSuccess || !contractors.isSuccess) {
    return (
      <RouteSheet title={t('contractorWorks.sectionTitle')} closeTo={closeTo}>
        {work.isError ? (
          <ErrorNote message={loadErrorMessage(work.error, t('contractorWorks.notFound'), t)} />
        ) : contractors.isError ? (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={apiErrorMessage(contractors.error)}
          />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </RouteSheet>
    );
  }

  return (
    <CorrectionForm
      key={work.data.id}
      work={work.data}
      contractorNames={contractors.data.map((c) => c.contractorName)}
      rates={campaign.transportRates}
    />
  );
}

/**
 * A work stays on its batch: the batch is not a field here, and cancelling comes back to it.
 * Cancelling asks for a second step; the row stays in the database (reference document,
 * section 5).
 */
function CorrectionForm({
  work,
  contractorNames,
  rates,
}: {
  work: ContractorWork;
  contractorNames: ReadonlyArray<string>;
  rates: ReadonlyArray<number>;
}) {
  const update = useUpdateContractorWork(work.campaignId, work.id);
  const cancel = useCancelContractorWork(work.campaignId, work.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
  const batchPath = `/lots/${work.kilnBatchId}`;
  const form = useForm<ContractorWorkForm>({
    defaultValues: {
      date: work.date,
      type: work.type,
      contractorName: work.contractorName,
      quantity: String(work.quantity),
      rate: work.rate === null ? '' : String(work.rate),
    },
  });
  const type = form.watch('type');

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        date: values.date,
        type: values.type as ContractorWorkType,
        contractorName: values.contractorName,
        quantity: Number(digitsOnly(values.quantity)),
        rate: values.type === 'transport' && values.rate !== '' ? Number(values.rate) : null,
      },
      { onSuccess: (saved) => form.reset({ ...values, quantity: String(saved.quantity) }) },
    ),
  );
  const cancelWork = () => cancel.mutate(undefined, { onSuccess: () => void navigate(batchPath) });
  const busy = update.isPending || cancel.isPending;

  return (
    <RouteSheet
      title={work.contractorName}
      description={`${t(WORK_TYPE_KEY[work.type])} · ${format.date(work.date)} · ${format.bricks(work.quantity)}`}
      closeTo={batchPath}
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <ContractorWorkFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          contractorNames={contractorNames}
          type={type}
          rates={rates}
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
            keepLabel={t('contractorWorks.keepWork')}
            onConfirm={cancelWork}
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
            {t('contractorWorks.cancelWork')}
          </Button>
        )}
      </form>
    </RouteSheet>
  );
}
