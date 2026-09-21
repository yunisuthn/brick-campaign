import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import {
  type ContractorBalance,
  type MoulderBalance,
  useContractorBalances,
  useMoulderBalances,
} from './useBalances.js';

export function BalancesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('balances.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year, tranche: campaign.tranche })}
      </h1>
      {campaign ? (
        <Balances campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('balances.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function Balances({ campaignId }: { campaignId: string }) {
  const moulders = useMoulderBalances(campaignId);
  const contractors = useContractorBalances(campaignId);
  const { t } = useTranslation();

  const failed = [moulders, contractors].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!moulders.isSuccess || !contractors.isSuccess)
    return <p role="status">{t('common.loading')}</p>;

  return (
    <>
      <section aria-labelledby="moulders">
        <h2 id="moulders">{t('balances.mouldersTitle')}</h2>
        {moulders.data.length === 0 ? (
          <p>{t('balances.mouldersNone')}</p>
        ) : (
          <>
            <TotalDue balances={moulders.data} />
            <ul className="rows">
              {moulders.data.map((line) => (
                <li key={line.moulderId}>
                  <BalanceCard
                    name={line.name}
                    work={formatBricks(line.bricks)}
                    balance={line}
                    missingRate={t('balances.mouldingRateToFix')}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section aria-labelledby="contractors">
        <h2 id="contractors">{t('balances.contractorsTitle')}</h2>
        {contractors.data.length === 0 ? (
          <p>{t('balances.contractorsNone')}</p>
        ) : (
          <ul className="rows">
            {contractors.data.map((line) => (
              <li key={line.contractorName}>
                <BalanceCard
                  name={line.contractorName}
                  work={contractorWork(line, t)}
                  balance={line}
                  missingRate={t('balances.contractorRateToFix')}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function contractorWork(
  line: ContractorBalance,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const parts: string[] = [];
  if (line.bricksByType.transport > 0) {
    parts.push(
      t('balances.bricksTransported', { quantity: formatBricks(line.bricksByType.transport) }),
    );
  }
  if (line.bricksByType.kiln_loading > 0) {
    parts.push(
      t('balances.bricksLoaded', { quantity: formatBricks(line.bricksByType.kiln_loading) }),
    );
  }
  return parts.length === 0 ? t('balances.noWork') : parts.join(' · ');
}

/** Summed across every moulder listed below; unknown as a whole as soon as one of them is
 * (reference document, section 4), rather than adding up the known ones and leaving out the rest. */
function TotalDue({ balances }: { balances: ReadonlyArray<Pick<MoulderBalance, 'due'>> }) {
  const { t } = useTranslation();
  const total = balances.some((line) => line.due === null)
    ? null
    : balances.reduce((sum, line) => sum + (line.due ?? 0), 0);

  return (
    <p className="strong">
      {total === null ? (
        <>
          {t('balances.totalDue')} : <em>{t('balances.mouldingRateToFix')}</em>
        </>
      ) : (
        <>
          {total < 0 ? t('balances.totalOverpaid') : t('balances.totalDue')} :{' '}
          {formatAmount(Math.abs(total))}
        </>
      )}
    </p>
  );
}

interface BalanceCardProps {
  name: string;
  work: string;
  balance: Pick<MoulderBalance, 'earned' | 'paid' | 'due'>;
  /** Said instead of an amount when the rate the line needs is not fixed yet. */
  missingRate: string;
}

/**
 * What is earned, and so what is due, is unknown while the campaign rate is not fixed
 * (reference document, section 4). The screen says so; it never shows a zero in its place.
 */
function BalanceCard({ name, work, balance, missingRate }: BalanceCardProps) {
  const { t } = useTranslation();
  return (
    <>
      <strong>{name}</strong>
      <span className="sub">{work}</span>
      <dl className="facts">
        <Line label={t('balances.earned')}>
          {balance.earned === null ? <em>{missingRate}</em> : formatAmount(balance.earned)}
        </Line>
        <Line label={t('balances.paid')}>{formatAmount(balance.paid)}</Line>
        <Line
          label={
            balance.due !== null && balance.due < 0 ? t('balances.overpaid') : t('balances.due')
          }
        >
          {balance.due === null ? (
            <em>{t('balances.unknownUntilRate')}</em>
          ) : (
            formatAmount(Math.abs(balance.due))
          )}
        </Line>
      </dl>
    </>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}
