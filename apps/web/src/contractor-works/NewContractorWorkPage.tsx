import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type ContractorWorkForm, ContractorWorkFields } from './contractorWorkFields.js';
import { type ContractorWorkType, useCreateContractorWork } from './useContractorWorks.js';

/** A new work, in a sheet over the page of its batch (reference document, section 10.12). */
export function NewContractorWorkPage() {
  const { id: batchId = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet title={t('contractorWorks.newTitle')} closeTo={`/lots/${batchId}`}>
      {campaign ? (
        <WorkForm campaign={campaign} batchId={batchId} />
      ) : (
        <p className="text-muted-foreground">{t('contractorWorks.noCampaignShort')}</p>
      )}
    </RouteSheet>
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
      <ErrorNote
        prefix={t('common.loadFailedPrefix')}
        message={apiErrorMessage(contractors.error)}
      />
    );
  }
  if (!contractors.isSuccess) {
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
        kilnBatchId: batchId,
        date: values.date,
        type: values.type as ContractorWorkType,
        contractorName: values.contractorName,
        quantity: Number(digitsOnly(values.quantity)),
        rate: values.type === 'transport' && values.rate !== '' ? Number(values.rate) : null,
      },
      { onSuccess: () => void navigate(`/lots/${batchId}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ContractorWorkFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        contractorNames={contractors.data.map((c) => c.contractorName)}
        type={type}
        rates={campaign.transportRates}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('common.save')} busy={create.isPending} />
    </form>
  );
}
