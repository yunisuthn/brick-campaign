import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatBricks, formatDate } from '../format.js';
import { type ContractorWorkForm, ContractorWorkFields } from './contractorWorkFields.js';
import {
  type ContractorWork,
  type ContractorWorkType,
  useCancelContractorWork,
  useContractorWork,
  useUpdateContractorWork,
  WORK_TYPE_LABELS,
} from './useContractorWorks.js';

export function ContractorWorkPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      {campaign ? <LoadedWork campaign={campaign} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

function LoadedWork({ campaign, id }: { campaign: Campaign; id: string }) {
  const work = useContractorWork(campaign.id, id);
  const contractors = useContractorBalances(campaign.id);

  if (work.isError) {
    return <p role="alert">{loadErrorMessage(work.error, 'Prestation introuvable.')}</p>;
  }
  if (contractors.isError) {
    return <p role="alert">Chargement impossible : {apiErrorMessage(contractors.error)}</p>;
  }
  if (!work.isSuccess || !contractors.isSuccess) return <p role="status">Chargement…</p>;

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
        quantity: Number(values.quantity),
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
        <Link to={batchPath}>Retour au lot</Link>
      </p>
      <h1>
        {work.contractorName}
        <span className="title-sub">
          {WORK_TYPE_LABELS[work.type]} · {formatDate(work.date)} · {formatBricks(work.quantity)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <ContractorWorkFields
          register={form.register}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          contractorNames={contractorNames}
          type={type}
          rates={rates}
        />
        {updateRefusal.message && (
          <p role="alert">Enregistrement impossible : {updateRefusal.message}</p>
        )}
        {cancel.isError && (
          <p role="alert">Annulation impossible : {apiErrorMessage(cancel.error)}</p>
        )}
        <p className="actions">
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            Enregistrer
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelWork} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder la prestation
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler la prestation
            </button>
          )}
        </p>
      </form>
    </>
  );
}
