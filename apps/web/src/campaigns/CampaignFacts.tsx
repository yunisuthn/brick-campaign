import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { Campaign } from './useCampaigns.js';

/** A rate not negotiated yet reads "à fixer", never 0 (reference document, section 4). */
export function rateText(rate: number | null, t: ReturnType<typeof useTranslation>['t']): string {
  return rate === null ? t('campaigns.rateToFix') : t('campaigns.rateUnit', { amount: formatAmount(rate) });
}

/** Several prices read as a choice, since one is picked per entry (rice fields are not all the
 * same distance away); none yet reads "à fixer" the same way a single rate does. */
export function priceListText(
  rates: readonly number[],
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (rates.length === 0) return t('campaigns.rateToFix');
  return t('campaigns.rateUnit', { amount: rates.map((rate) => formatAmount(rate)).join(' ou ') });
}

/** What the list card and the detail page both say: open or closed since when, and the three rates. */
export function CampaignFacts({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  return (
    <>
      <p>
        {campaign.closedOn === null
          ? t('campaigns.openSince', { date: formatDate(campaign.startedOn) })
          : t('campaigns.closedOn', { date: formatDate(campaign.closedOn) })}
      </p>
      <dl className="facts">
        <dt>{t('campaigns.mouldingLabel')}</dt>
        <dd>{priceListText(campaign.mouldingRates, t)}</dd>
        <dt>{t('campaigns.transportLabel')}</dt>
        <dd>{priceListText(campaign.transportRates, t)}</dd>
        <dt>{t('campaigns.kilnLoadingLabel')}</dt>
        <dd>{rateText(campaign.kilnLoadingRate, t)}</dd>
      </dl>
    </>
  );
}
