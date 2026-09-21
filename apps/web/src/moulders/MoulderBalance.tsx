import { apiErrorMessage } from '../api/errorMessages.js';
import { useMoulderBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';

/**
 * What a moulder is owed on the current campaign: earned, paid, and what remains — the same
 * figures as the Soldes page, for the one moulder this page is about. A balance lives on the
 * campaign, not the moulder (reference document, section 4): work and payments both belong to
 * a season, so the same person starts at zero again on the next one.
 */
export function MoulderBalance({ moulderId }: { moulderId: string }) {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <section aria-labelledby="moulder-balance">
      <h2 id="moulder-balance">
        {t('moulders.balanceOnCampaign')}
        {campaign &&
          ` ${campaign.year}${t('campaigns.trancheSuffix', { tranche: campaign.tranche })}`}
      </h2>
      {campaign ? (
        <Linked campaignId={campaign.id} moulderId={moulderId} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </section>
  );
}

function Linked({ campaignId, moulderId }: { campaignId: string; moulderId: string }) {
  const balances = useMoulderBalances(campaignId);
  const { t } = useTranslation();

  if (balances.isError)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(balances.error)}
      </p>
    );
  if (!balances.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const line = balances.data.find((balance) => balance.moulderId === moulderId);
  if (!line) return <p>{t('moulders.noEntriesOnCampaign')}</p>;

  return (
    <dl className="facts">
      <dt>{t('balances.earned')}</dt>
      <dd>
        {line.earned === null ? (
          <em>{t('balances.mouldingRateToFix')}</em>
        ) : (
          formatAmount(line.earned)
        )}
      </dd>
      <dt>{t('balances.paid')}</dt>
      <dd>{formatAmount(line.paid)}</dd>
      <dt>{line.due !== null && line.due < 0 ? t('balances.overpaid') : t('balances.due')}</dt>
      <dd>
        {line.due === null ? (
          <em>{t('balances.unknownUntilRate')}</em>
        ) : (
          formatAmount(Math.abs(line.due))
        )}
      </dd>
    </dl>
  );
}
