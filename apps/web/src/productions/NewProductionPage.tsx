import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatBricks, today } from '../format.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ProductionForm, ProductionFields, toNewProduction } from './productionFields.js';
import { useCreateProduction } from './useProductions.js';

export function NewProductionPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/productions">Toutes les productions</Link>
      </p>
      <h1>Production du jour</h1>
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
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
 * The evening's entry runs through the moulders one after the other: after a save the form
 * stays, keeps the date and the rice field, clears the moulder and the quantity, and says
 * what was just saved. Only active moulders are offered.
 */
function EntryForm({ campaignId }: { campaignId: string }) {
  const moulders = useMoulders();
  const riceFields = useRiceFields();
  const create = useCreateProduction(campaignId);
  const [saved, setSaved] = useState<string | null>(null);
  const form = useForm<ProductionForm>({
    defaultValues: { date: today(), moulderId: '', riceFieldId: '', quantity: '' },
  });

  if (moulders.isError || riceFields.isError) {
    const error = moulders.error ?? riceFields.error;
    return <p role="alert">Chargement impossible : {error?.message}</p>;
  }
  if (!moulders.isSuccess || !riceFields.isSuccess) return <p role="status">Chargement…</p>;

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
        errors={form.formState.errors}
        moulders={moulders.data}
        riceFields={riceFields.data}
      />
      {create.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {apiErrorMessage(create.error)}
        </p>
      )}
      {saved && !create.isError && (
        <p role="status" style={{ color: 'var(--ok)' }}>
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
