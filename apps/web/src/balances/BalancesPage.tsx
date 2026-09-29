import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useCreatePayment } from '../payments/usePayments.js';
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
                    action={<SettleButton campaignId={campaignId} balance={line} />}
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
  /** Shown at the far end of the name's line. */
  action?: ReactNode;
}

/**
 * What is earned, and so what is due, is unknown while the campaign rate is not fixed
 * (reference document, section 4). The screen says so; it never shows a zero in its place.
 */
function BalanceCard({ name, work, balance, missingRate, action }: BalanceCardProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="row-split">
        <div>
          <strong>{name}</strong>
          <span className="sub">{work}</span>
        </div>
        {action}
      </div>
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

/**
 * Pays what is left to a moulder in one go: a settlement payment, dated today, of exactly the
 * amount due. Asks for a second click naming the amount first, the way cancelling an entry does.
 * Offered only when something is owed: nothing to settle while the rate is unknown or once the
 * moulder is paid up or overpaid.
 */
function SettleButton({
  campaignId,
  balance,
}: {
  campaignId: string;
  balance: Pick<MoulderBalance, 'moulderId' | 'due'>;
}) {
  const create = useCreatePayment(campaignId);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();

  if (balance.due === null || balance.due <= 0) return null;
  const due = balance.due;

  const settle = () =>
    create.mutate(
      { moulderId: balance.moulderId, type: 'settlement', date: today(), amount: due },
      {
        onSuccess: () => {
          setConfirming(false);
          return queryClient.invalidateQueries({ queryKey: ['balances', campaignId] });
        },
      },
    );

  return (
    <div className={confirming ? 'settle is-confirming' : 'settle'}>
      {confirming ? (
        <>
          <button type="button" onClick={settle} disabled={create.isPending}>
            {t('balances.confirmSettle', { amount: formatAmount(due) })}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={create.isPending}>
            {t('common.cancel')}
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirming(true)}>
          {t('balances.settle')}
        </button>
      )}
      {create.isError && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {apiErrorMessage(create.error)}
        </p>
      )}
    </div>
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
