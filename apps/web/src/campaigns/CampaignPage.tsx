import { Link, useParams } from 'react-router';
import { ApiError } from '../api/client.js';
import { CampaignFacts } from './CampaignFacts.js';
import { useCampaign } from './useCampaigns.js';

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
        </>
      )}
    </main>
  );
}
