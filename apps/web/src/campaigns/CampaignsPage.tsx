import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { CampaignFacts } from './CampaignFacts.js';
import { type Campaign, useCampaigns } from './useCampaigns.js';

export function CampaignsPage() {
  const campaigns = useCampaigns();

  return (
    <main className="page-wide">
      <h1>Campagnes</h1>
      <p>
        <Link to="/campagnes/nouvelle">Nouvelle campagne</Link>
      </p>
      {campaigns.isPending && <p role="status">Chargement…</p>}
      {campaigns.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(campaigns.error)}</p>
      )}
      {campaigns.isSuccess &&
        (campaigns.data.length === 0 ? (
          <p>Aucune campagne.</p>
        ) : (
          <ul className="rows">
            {campaigns.data.map((campaign) => (
              <li key={campaign.id}>
                <CampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}

/** One campaign at a glance; its year leads to the detail page. */
function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article aria-labelledby={`campaign-${campaign.id}`} className="card">
      <h2 id={`campaign-${campaign.id}`}>
        <Link to={`/campagnes/${campaign.id}`}>Campagne {campaign.year}</Link>
      </h2>
      <CampaignFacts campaign={campaign} />
    </article>
  );
}
