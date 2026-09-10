import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { ApiError } from '../api/client.js';
import { today } from '../format.js';
import { CampaignFacts } from './CampaignFacts.js';
import { type Campaign, useCampaign, useCloseCampaign } from './useCampaigns.js';

/** A wrong or stale id is a plain "not found", not an API failure. */
function loadErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.status === 404) return 'Campagne introuvable.';
  return `Chargement impossible : ${error.message}`;
}

export function CampaignPage() {
  const { id = '' } = useParams();
  const campaign = useCampaign(id);

  return (
    <main style={{ padding: '1rem' }}>
      <p>
        <Link to="/campagnes">Toutes les campagnes</Link>
      </p>
      {campaign.isPending && <p role="status">Chargement…</p>}
      {campaign.isError && <p role="alert">{loadErrorMessage(campaign.error)}</p>}
      {campaign.isSuccess && (
        <>
          <h1>Campagne {campaign.data.year}</h1>
          <CampaignFacts campaign={campaign.data} />
          {campaign.data.closedOn === null && <CloseCampaign campaign={campaign.data} />}
        </>
      )}
    </main>
  );
}

/**
 * Closing asks for the date and nothing else, today by default. The form only shows on request:
 * closing is a once-a-season act, not something to brush against while reading the page.
 * The API keeps the rule that the closing date cannot precede the start; its message is shown.
 */
function CloseCampaign({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const close = useCloseCampaign(campaign.id);
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

  const submit = form.handleSubmit(({ closedOn }) => close.mutate(closedOn));

  return (
    <form onSubmit={submit} noValidate style={{ marginTop: '1rem', maxWidth: '24rem' }}>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Date de clôture
        <input
          type="date"
          style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
          {...form.register('closedOn', { required: 'La date de clôture est requise.' })}
        />
        {form.formState.errors.closedOn && (
          <span role="alert" style={{ display: 'block', color: 'var(--error)' }}>
            {form.formState.errors.closedOn.message}
          </span>
        )}
      </label>
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
