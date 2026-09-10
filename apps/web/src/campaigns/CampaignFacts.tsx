import { formatAmount, formatDate } from '../format.js';
import type { Campaign } from './useCampaigns.js';

/** A rate not negotiated yet reads "à fixer", never 0 (reference document, section 4). */
export function rateText(rate: number | null): string {
  return rate === null ? 'À fixer' : `${formatAmount(rate)} la brique`;
}

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
        <dd style={{ margin: 0 }}>{rateText(campaign.mouldingRate)}</dd>
        <dt>Transport</dt>
        <dd style={{ margin: 0 }}>{rateText(campaign.transportRate)}</dd>
        <dt>Enfournement</dt>
        <dd style={{ margin: 0 }}>{rateText(campaign.kilnLoadingRate)}</dd>
      </dl>
    </>
  );
}
