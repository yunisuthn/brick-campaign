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
      <p>
        {campaign.closedOn === null
          ? `Ouverte depuis le ${formatDate(campaign.startedOn)}`
          : `Clôturée le ${formatDate(campaign.closedOn)}`}
      </p>
      <dl className="facts">
        <dt>Moulage</dt>
        <dd>{rateText(campaign.mouldingRate)}</dd>
        <dt>Transport</dt>
        <dd>{rateText(campaign.transportRate)}</dd>
        <dt>Enfournement</dt>
        <dd>{rateText(campaign.kilnLoadingRate)}</dd>
      </dl>
    </>
  );
}
