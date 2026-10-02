import { AmountRow } from '@/components/AmountRow';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Separator } from '@/components/ui/separator';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useMoulderBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
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
    <SectionCard
      title={`${t('moulders.balanceOnCampaign')}${
        campaign
          ? ` ${campaign.year}${t('campaigns.trancheSuffix', { tranche: campaign.tranche })}`
          : ''
      }`}
    >
      {campaign ? (
        <Linked campaignId={campaign.id} moulderId={moulderId} />
      ) : (
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      )}
    </SectionCard>
  );
}

function Linked({ campaignId, moulderId }: { campaignId: string; moulderId: string }) {
  const balances = useMoulderBalances(campaignId);
  const { t } = useTranslation();

  if (balances.isError) {
    return (
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(balances.error)} />
    );
  }
  if (!balances.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const line = balances.data.find((balance) => balance.moulderId === moulderId);
  if (!line) return <p className="text-muted-foreground">{t('moulders.noEntriesOnCampaign')}</p>;

  const overpaid = line.due !== null && line.due < 0;
  return (
    <>
      <dl>
        <AmountRow
          label={t('balances.earned')}
          value={line.earned}
          unknownLabel={t('balances.mouldingRateToFix')}
        />
        <AmountRow label={t('balances.paid')} value={line.paid} />
      </dl>
      <Separator className="my-2" />
      <dl>
        <AmountRow
          label={overpaid ? t('balances.overpaid') : t('balances.due')}
          value={line.due === null ? null : Math.abs(line.due)}
          unknownLabel={t('balances.unknownUntilRate')}
          strong
        />
      </dl>
    </>
  );
}
