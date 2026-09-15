import { formatAmount, formatDate } from '../format.js';
import type { Campaign } from './useCampaigns.js';

/** A rate not negotiated yet reads "à fixer", never 0 (reference document, section 4). */
export function rateText(rate: number | null): string {
  return rate === null ? 'À fixer' : `${formatAmount(rate)} la brique`;
}

/** Several prices read as a choice, since one is picked per entry (rice fields are not all the
 * same distance away); none yet reads "à fixer" the same way a single rate does. */
export function priceListText(rates: readonly number[]): string {
  if (rates.length === 0) return 'À fixer';
  return `${rates.map((rate) => formatAmount(rate)).join(' ou ')} la brique`;
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
        <dd>{priceListText(campaign.mouldingRates)}</dd>
        <dt>Transport</dt>
        <dd>{priceListText(campaign.transportRates)}</dd>
        <dt>Enfournement</dt>
        <dd>{rateText(campaign.kilnLoadingRate)}</dd>
      </dl>
    </>
  );
}
