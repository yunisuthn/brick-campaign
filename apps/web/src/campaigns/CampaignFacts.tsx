import { formatAmount, formatDate } from '../format.js';
import type { Campaign } from './useCampaigns.js';

/** What the list card and the detail page both say: open or closed since when, and the three rates. */
export function CampaignFacts({ campaign }: { campaign: Campaign }) {
  return (
    <>
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
    </>
  );
}
