import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { Field } from '../form/Field.js';
import { today } from '../format.js';
import { CampaignFacts } from './CampaignFacts.js';
import { RateFields } from './rateFields.js';
import {
  type Campaign,
  type CampaignRates,
  useCampaign,
  useUpdateCampaign,
} from './useCampaigns.js';

export function CampaignPage() {
  const { id = '' } = useParams();
  const campaign = useCampaign(id);

  return (
    <main style={{ padding: '1rem' }}>
      <p>
        <Link to="/campagnes">Toutes les campagnes</Link>
      </p>
      {campaign.isPending && <p role="status">Chargement…</p>}
      {campaign.isError && (
        <p role="alert">{loadErrorMessage(campaign.error, 'Campagne introuvable.')}</p>
      )}
      {campaign.isSuccess && (
        <>
          <h1>Campagne {campaign.data.year}</h1>
          <CampaignFacts campaign={campaign.data} />
          <EditRates campaign={campaign.data} />
          {campaign.data.closedOn === null && <CloseCampaign campaign={campaign.data} />}
        </>
      )}
    </main>
  );
}

const formStyle = { marginTop: '1rem', maxWidth: '24rem' };

/**
 * The rates are fixed here once negotiated, and can be corrected later; a rate fixed after
 * the fact applies to the whole campaign (reference document, section 4).
 */
function EditRates({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCampaign(campaign.id);
  const form = useForm<CampaignRates>({
    defaultValues: {
      mouldingRate: campaign.mouldingRate,
      transportRate: campaign.transportRate,
      kilnLoadingRate: campaign.kilnLoadingRate,
    },
  });

  if (!open) {
    return (
      <p>
        <button type="button" onClick={() => setOpen(true)}>
          Modifier les tarifs
        </button>
      </p>
    );
  }

  const submit = form.handleSubmit((rates) =>
    update.mutate(rates, { onSuccess: () => setOpen(false) }),
  );

  return (
    <form onSubmit={submit} noValidate style={formStyle} aria-label="Tarifs de la campagne">
      <RateFields register={form.register} errors={form.formState.errors} />
      {update.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {update.error.message}
        </p>
      )}
      <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="submit" disabled={update.isPending}>
          Enregistrer les tarifs
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </p>
    </form>
  );
}

/**
 * Closing asks for the date and nothing else, today by default. The form only shows on request:
 * closing is a once-a-season act, not something to brush against while reading the page.
 * The API keeps the rule that the closing date cannot precede the start; its message is shown.
 */
function CloseCampaign({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const close = useUpdateCampaign(campaign.id);
  const form = useForm<{ closedOn: string }>({ defaultValues: { closedOn: today() } });

  if (!open) {
    return (
      <p>
        <button type="button" onClick={() => setOpen(true)}>
          Clôturer la campagne
        </button>
      </p>
    );
  }

  const submit = form.handleSubmit(({ closedOn }) => close.mutate({ closedOn }));

  return (
    <form onSubmit={submit} noValidate style={formStyle}>
      <Field
        label="Date de clôture"
        error={form.formState.errors.closedOn}
        input={form.register('closedOn', { required: 'La date de clôture est requise.' })}
        type="date"
      />
      {close.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Clôture impossible : {close.error.message}
        </p>
      )}
      <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="submit" disabled={close.isPending}>
          Confirmer la clôture
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </p>
    </form>
  );
}
