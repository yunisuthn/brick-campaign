import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type ContractorWorkForm, ContractorWorkFields } from './contractorWorkFields.js';
import { type ContractorWorkType, useCreateContractorWork } from './useContractorWorks.js';

export function NewContractorWorkPage() {
  const { id: batchId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to={`/lots/${batchId}`}>{t('contractorWorks.backToBatch')}</Link>
      </p>
      <h1>{t('contractorWorks.newTitle')}</h1>
      {campaign ? (
        <WorkForm campaign={campaign} batchId={batchId} />
      ) : (
        <p>{t('contractorWorks.noCampaignShort')}</p>
      )}
    </main>
  );
}

/** Back to the batch after saving: a work is entered from the batch it belongs to. */
function WorkForm({ campaign, batchId }: { campaign: Campaign; batchId: string }) {
  const contractors = useContractorBalances(campaign.id);
  const create = useCreateContractorWork(campaign.id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<ContractorWorkForm>({
    defaultValues: { date: today(), type: 'transport', contractorName: '', quantity: '', rate: '' },
  });
  const type = form.watch('type');

  if (contractors.isError) {
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(contractors.error)}
      </p>
    );
  }
  if (!contractors.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        kilnBatchId: batchId,
        date: values.date,
        type: values.type as ContractorWorkType,
        contractorName: values.contractorName,
        quantity: Number(digitsOnly(values.quantity)),
        rate: values.type === 'transport' && values.rate !== '' ? Number(values.rate) : null,
      },
      { onSuccess: () => navigate(`/lots/${batchId}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <ContractorWorkFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        contractorNames={contractors.data.map((c) => c.contractorName)}
        type={type}
        rates={campaign.transportRates}
      />
      {createRefusal.message && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('common.save')}
        </button>
      </p>
    </form>
  );
}
