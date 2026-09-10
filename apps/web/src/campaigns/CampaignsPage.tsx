import { Link } from 'react-router';
import { formatAmount, formatDate } from '../format.js';
import { type Campaign, useCampaigns } from './useCampaigns.js';

export function CampaignsPage() {
  const campaigns = useCampaigns();

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Campagnes</h1>
      <p>
        <Link to="/campagnes/nouvelle">Nouvelle campagne</Link>
      </p>
      {campaigns.isPending && <p role="status">Chargement…</p>}
      {campaigns.isError && <p role="alert">Chargement impossible : {campaigns.error.message}</p>}
      {campaigns.isSuccess &&
        (campaigns.data.length === 0 ? (
          <p>Aucune campagne.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {campaigns.data.map((campaign) => (
              <li key={campaign.id} style={{ marginBottom: '0.75rem' }}>
                <CampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}

/** One campaign at a glance: its year, whether it is still open, and the three rates of the season. */
function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article
      aria-labelledby={`campaign-${campaign.id}`}
      style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: '0.5rem' }}
    >
      <h2 id={`campaign-${campaign.id}`} style={{ margin: '0 0 0.25rem', fontSize: '1.125rem' }}>
        Campagne {campaign.year}
      </h2>
      <p style={{ margin: '0 0 0.5rem' }}>
        {campaign.closedOn === null
          ? `Ouverte depuis le ${formatDate(campaign.startedOn)}`
          : `Clôturée le ${formatDate(campaign.closedOn)}`}
      </p>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '0.125rem 0.75rem',
          margin: 0,
        }}
      >
        <dt>Moulage</dt>
        <dd style={{ margin: 0 }}>{formatAmount(campaign.mouldingRate)} la brique</dd>
        <dt>Transport</dt>
        <dd style={{ margin: 0 }}>{formatAmount(campaign.transportRate)} la brique</dd>
        <dt>Enfournement</dt>
        <dd style={{ margin: 0 }}>{formatAmount(campaign.kilnLoadingRate)} la brique</dd>
      </dl>
    </article>
  );
}
