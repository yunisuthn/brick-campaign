import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatBricks, formatDate } from '../format.js';
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

  return (
    <main className="page">
      <p>
        <Link to="/productions">Toutes les productions</Link>
      </p>
      {campaign ? <LoadedProduction campaignId={campaign.id} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

/** The entry, the moulders it may name (its own even if retired) and the rice fields, all before the form. */
function LoadedProduction({ campaignId, id }: { campaignId: string; id: string }) {
  const production = useProduction(campaignId, id);
  const moulders = useMoulders(true);
  const riceFields = useRiceFields();

  if (production.isError) {
    return <p role="alert">{loadErrorMessage(production.error, 'Saisie introuvable.')}</p>;
  }
  const failed = [moulders, riceFields].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">Chargement impossible : {failed.error && apiErrorMessage(failed.error)}</p>
    );
  if (!production.isSuccess || !moulders.isSuccess || !riceFields.isSuccess) {
    return <p role="status">Chargement…</p>;
  }

  const choosable = moulders.data.filter((m) => m.active || m.id === production.data.moulderId);
  return (
    <CorrectionForm
      key={production.data.id}
      production={production.data}
      moulders={choosable}
      riceFields={riceFields.data}
    />
  );
}

interface CorrectionFormProps {
  production: Production;
  moulders: ReadonlyArray<{ id: string; name: string }>;
  riceFields: ReadonlyArray<{ id: string; name: string }>;
}

/**
 * A correction sends the whole entry back; cancelling asks for a second click, then goes back
 * to the list. A cancelled entry is gone from the API, its row stays in the database
 * (reference document, section 5).
 */
function CorrectionForm({ production, moulders, riceFields }: CorrectionFormProps) {
  const update = useUpdateProduction(production.campaignId, production.id);
  const cancel = useCancelProduction(production.campaignId, production.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ProductionForm>({
    defaultValues: {
      date: production.date,
      moulderId: production.moulderId,
      riceFieldId: production.riceFieldId,
      quantity: String(production.quantity),
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

  return (
    <>
      <h1>
        {moulderName}, {formatDate(production.date)}
        <span className="title-sub">{formatBricks(production.quantity)}</span>
      </h1>
      <form onSubmit={save} noValidate>
        <ProductionFields
          register={form.register}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          moulders={moulders}
          riceFields={riceFields}
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
              <button type="button" onClick={cancelEntry} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder la saisie
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler la saisie
            </button>
          )}
        </p>
      </form>
    </>
  );
}
