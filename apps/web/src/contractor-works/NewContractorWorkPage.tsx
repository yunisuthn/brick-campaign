import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { type ContractorWorkForm, ContractorWorkFields } from './contractorWorkFields.js';
import { type ContractorWorkType, useCreateContractorWork } from './useContractorWorks.js';

export function NewContractorWorkPage() {
  const { id: batchId = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to={`/lots/${batchId}`}>Retour au lot</Link>
      </p>
      <h1>Nouvelle prestation</h1>
      {campaign ? <WorkForm campaignId={campaign.id} batchId={batchId} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

/** Back to the batch after saving: a work is entered from the batch it belongs to. */
function WorkForm({ campaignId, batchId }: { campaignId: string; batchId: string }) {
  const contractors = useContractorBalances(campaignId);
  const create = useCreateContractorWork(campaignId);
  const navigate = useNavigate();
  const form = useForm<ContractorWorkForm>({
    defaultValues: { date: today(), type: 'transport', contractorName: '', quantity: '' },
  });

  if (contractors.isError) {
    return <p role="alert">Chargement impossible : {contractors.error.message}</p>;
  }
  if (!contractors.isSuccess) return <p role="status">Chargement…</p>;

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        kilnBatchId: batchId,
        date: values.date,
        type: values.type as ContractorWorkType,
        contractorName: values.contractorName,
        quantity: Number(values.quantity),
      },
      { onSuccess: () => navigate(`/lots/${batchId}`) },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <ContractorWorkFields
        register={form.register}
        errors={form.formState.errors}
        contractorNames={contractors.data.map((c) => c.contractorName)}
      />
      {create.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {create.error.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer
        </button>
      </p>
    </form>
  );
}
