import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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

export function ContractorWorkPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      {campaign ? (
        <LoadedWork campaign={campaign} id={id} />
      ) : (
        <p>{t('contractorWorks.noCampaignShort')}</p>
      )}
    </main>
  );
}

function LoadedWork({ campaign, id }: { campaign: Campaign; id: string }) {
  const work = useContractorWork(campaign.id, id);
  const contractors = useContractorBalances(campaign.id);
  const { t } = useTranslation();

  if (work.isError) {
    return <p role="alert">{loadErrorMessage(work.error, t('contractorWorks.notFound'))}</p>;
  }
  if (contractors.isError) {
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(contractors.error)}
      </p>
    );
  }
  if (!work.isSuccess || !contractors.isSuccess) return <p role="status">{t('common.loading')}</p>;

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
 * Cancelling asks for a second click; the row stays in the database (reference document,
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
  const cancelWork = () => cancel.mutate(undefined, { onSuccess: () => navigate(batchPath) });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <p>
        <Link to={batchPath}>{t('contractorWorks.backToBatch')}</Link>
      </p>
      <h1>
        {work.contractorName}
        <span className="title-sub">
          {t(WORK_TYPE_KEY[work.type])} · {formatDate(work.date)} · {formatBricks(work.quantity)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <ContractorWorkFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          contractorNames={contractorNames}
          type={type}
          rates={rates}
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
              <button type="button" onClick={cancelWork} disabled={busy}>
                {t('common.confirmCancellation')}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                {t('contractorWorks.keepWork')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              {t('contractorWorks.cancelWork')}
            </button>
          )}
        </p>
      </form>
    </>
  );
}
