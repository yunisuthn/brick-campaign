import { cn } from '@/lib/utils';
import { formatAmount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import type { Campaign } from './useCampaigns.js';

/** A rate not negotiated yet reads "à fixer", never 0 (reference document, section 4). */
export function rateText(rate: number | null, t: ReturnType<typeof useTranslation>['t']): string {
  return rate === null
    ? t('campaigns.rateToFix')
    : t('campaigns.rateUnit', { amount: formatAmount(rate) });
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

/** Open since when, or closed when: a green dot while open. */
export function CampaignState({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const format = useFormat();
  const open = campaign.closedOn === null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <span
        aria-hidden="true"
        className={cn('size-2 shrink-0 rounded-full', open ? 'bg-success' : 'bg-stock-raw')}
      />
      {campaign.closedOn === null
        ? t('campaigns.openSince', { date: format.date(campaign.startedOn) })
        : t('campaigns.closedOn', { date: format.date(campaign.closedOn) })}
    </p>
  );
}

/** The three rates, a label on the left and its price on the right. */
export function CampaignRatesList({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const rows = [
    [t('campaigns.mouldingLabel'), priceListText(campaign.mouldingRates, t)],
    [t('campaigns.transportLabel'), priceListText(campaign.transportRates, t)],
    [t('campaigns.kilnLoadingLabel'), rateText(campaign.kilnLoadingRate, t)],
  ] as const;
  return (
    <dl>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
