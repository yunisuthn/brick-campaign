import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatBricks, today } from '../format.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ProductionForm, ProductionFields, toNewProduction } from './productionFields.js';
import { useCreateProduction } from './useProductions.js';

export function NewProductionPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page">
      <p>
        <Link to="/productions">Toutes les productions</Link>
      </p>
      <h1>Nouvelle production</h1>
      {campaign ? (
        <EntryForm campaign={campaign} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          une production.
        </p>
      )}
    </main>
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
  const form = useForm<ProductionForm>({
    defaultValues: { date: today(), moulderId: '', riceFieldId: '', quantity: '', rate: '' },
  });

  if (moulders.isError || riceFields.isError) {
    const error = moulders.error ?? riceFields.error;
    return <p role="alert">Chargement impossible : {error && apiErrorMessage(error)}</p>;
  }
  if (!moulders.isSuccess || !riceFields.isSuccess) return <p role="status">Chargement…</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewProduction(values), {
      onSuccess: (production) => {
        const name = moulders.data.find((m) => m.id === production.moulderId)?.name ?? '';
        setSaved(`Enregistré : ${name}, ${formatBricks(production.quantity)}.`);
        form.reset({ ...values, moulderId: '', quantity: '' });
        form.setFocus('moulderId');
      },
    }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <ProductionFields
        register={form.register}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        moulders={moulders.data}
        riceFields={riceFields.data}
        rates={campaign.mouldingRates}
      />
      {createRefusal.message && (
        <p role="alert">Enregistrement impossible : {createRefusal.message}</p>
      )}
      {saved && !create.isError && (
        <p role="status" className="done">
          {saved}
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
