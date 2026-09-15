import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { type ContractorWorkForm, ContractorWorkFields } from './contractorWorkFields.js';
import { type ContractorWorkType, useCreateContractorWork } from './useContractorWorks.js';

export function NewContractorWorkPage() {
  const { id: batchId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to={`/lots/${batchId}`}>Retour au lot</Link>
      </p>
      <h1>Nouvelle prestation</h1>
      {campaign ? <WorkForm campaign={campaign} batchId={batchId} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

/** Back to the batch after saving: a work is entered from the batch it belongs to. */
function WorkForm({ campaign, batchId }: { campaign: Campaign; batchId: string }) {
  const contractors = useContractorBalances(campaign.id);
  const create = useCreateContractorWork(campaign.id);
  const navigate = useNavigate();
  const form = useForm<ContractorWorkForm>({
    defaultValues: { date: today(), type: 'transport', contractorName: '', quantity: '', rate: '' },
  });
  const type = form.watch('type');

  if (contractors.isError) {
    return <p role="alert">Chargement impossible : {apiErrorMessage(contractors.error)}</p>;
  }
  if (!contractors.isSuccess) return <p role="status">Chargement…</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        kilnBatchId: batchId,
        date: values.date,
        type: values.type as ContractorWorkType,
        contractorName: values.contractorName,
        quantity: Number(values.quantity),
        rate: values.type === 'transport' && values.rate !== '' ? Number(values.rate) : null,
      },
      { onSuccess: () => navigate(`/lots/${batchId}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <ContractorWorkFields
        register={form.register}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        contractorNames={contractors.data.map((c) => c.contractorName)}
        type={type}
        rates={campaign.transportRates}
      />
      {createRefusal.message && (
        <p role="alert">Enregistrement impossible : {createRefusal.message}</p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer
        </button>
      </p>
    </form>
  );
}
