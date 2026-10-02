import { useQueryClient } from '@tanstack/react-query';
import { HandCoins } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { AmountRow } from '@/components/AmountRow';
import { Initials } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
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
    <Screen>
      <PageHeader
        title={t('balances.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <Balances campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="balances.noCampaignSuffix" />
      )}
    </Screen>
  );
}

function Balances({ campaignId }: { campaignId: string }) {
  const moulders = useMoulderBalances(campaignId);
  const contractors = useContractorBalances(campaignId);
  const { t } = useTranslation();
  const format = useFormat();

  const failed = [moulders, contractors].find((query) => query.isError);
  if (failed)
    return (
      <ErrorNote
        prefix={t('common.loadFailedPrefix')}
        message={failed.error && apiErrorMessage(failed.error)}
      />
    );
  if (!moulders.isSuccess || !contractors.isSuccess) return <LoadingList />;

  return (
    <>
      <Section title={t('balances.mouldersTitle')}>
        {moulders.data.length === 0 ? (
          <EmptyState icon={HandCoins} title={t('balances.mouldersNone')} />
        ) : (
          <>
            <TotalDue balances={moulders.data} />
            <ul className="flex flex-col gap-3">
              {moulders.data.map((line) => (
                <li key={line.moulderId}>
                  <MoulderCard campaignId={campaignId} line={line} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
      <Section title={t('balances.contractorsTitle')}>
        {contractors.data.length === 0 ? (
          <EmptyState icon={HandCoins} title={t('balances.contractorsNone')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {contractors.data.map((line) => (
              <li key={line.contractorName}>
                <BalanceCard
                  name={line.contractorName}
                  work={contractorWork(line, t, format.bricks)}
                  balance={line}
                  missingRate={t('balances.contractorRateToFix')}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function contractorWork(
  line: ContractorBalance,
  t: ReturnType<typeof useTranslation>['t'],
  bricks: (quantity: number) => string,
): string {
  const parts: string[] = [];
  if (line.bricksByType.transport > 0) {
    parts.push(t('balances.bricksTransported', { quantity: bricks(line.bricksByType.transport) }));
  }
  if (line.bricksByType.kiln_loading > 0) {
    parts.push(t('balances.bricksLoaded', { quantity: bricks(line.bricksByType.kiln_loading) }));
  }
  return parts.length === 0 ? t('balances.noWork') : parts.join(' · ');
}

/** Summed across every moulder listed below; unknown as a whole as soon as one of them is
 * (reference document, section 4), rather than adding up the known ones and leaving out the rest. */
function TotalDue({ balances }: { balances: ReadonlyArray<Pick<MoulderBalance, 'due'>> }) {
  const { t } = useTranslation();
  const format = useFormat();
  const total = balances.some((line) => line.due === null)
    ? null
    : balances.reduce((sum, line) => sum + (line.due ?? 0), 0);

  return (
    <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[10px] bg-tile px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {total !== null && total < 0 ? t('balances.totalOverpaid') : t('balances.totalDue')}
      </span>
      {total === null ? (
        <em className="text-sm text-muted-foreground">{t('balances.mouldingRateToFix')}</em>
      ) : (
        <span className="text-xl font-bold tabular-nums">{format.amount(Math.abs(total))}</span>
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
  /** Beside the name: the settling button. */
  action?: ReactNode;
  /** Under the figures: the settling's confirmation. */
  footer?: ReactNode;
}

/**
 * What is earned, and so what is due, is unknown while the campaign rate is not fixed
 * (reference document, section 4). The card says so; it never shows a zero in its place. Paid
 * beyond what is earned reads as money handed out ahead, in the amber box of the dashboard.
 */
function BalanceCard({ name, work, balance, missingRate, action, footer }: BalanceCardProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const overpaid = balance.due !== null && balance.due < 0;

  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <Initials name={name} />
        <div className="flex min-w-0 grow flex-col">
          <strong className="font-semibold">{name}</strong>
          <span className="text-[13px] text-muted-foreground">{work}</span>
        </div>
        {action}
      </div>
      <div>
        <dl>
          <AmountRow
            label={t('balances.earned')}
            value={balance.earned}
            unknownLabel={missingRate}
          />
          <AmountRow label={t('balances.paid')} value={balance.paid} />
        </dl>
        <Separator className="my-2" />
        {overpaid ? (
          <div
            role="note"
            className="rounded-lg border border-warning-border bg-warning-surface px-3 py-2.5 text-warning-foreground"
          >
            <dl>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-semibold">{t('balances.overpaid')}</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {format.amount(Math.abs(balance.due ?? 0))}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <dl>
            <AmountRow
              label={t('balances.due')}
              value={balance.due}
              unknownLabel={t('balances.unknownUntilRate')}
              strong
            />
          </dl>
        )}
      </div>
      {footer}
    </Card>
  );
}

/**
 * Pays what is left to a moulder in one go: a settlement payment, dated today, of exactly the
 * amount due. Asks for a second step naming the amount first, the way cancelling an entry does.
 * Offered only when something is owed: nothing to settle while the rate is unknown or once the
 * moulder is paid up or overpaid.
 */
function MoulderCard({ campaignId, line }: { campaignId: string; line: MoulderBalance }) {
  const create = useCreatePayment(campaignId);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
  const due = line.due !== null && line.due > 0 ? line.due : null;

  const settle = (amount: number) =>
    create.mutate(
      { moulderId: line.moulderId, type: 'settlement', date: today(), amount },
      {
        onSuccess: () => {
          setConfirming(false);
          return queryClient.invalidateQueries({ queryKey: ['balances', campaignId] });
        },
      },
    );

  return (
    <BalanceCard
      name={line.name}
      work={format.bricks(line.bricks)}
      balance={line}
      missingRate={t('balances.mouldingRateToFix')}
      action={
        due !== null &&
        !confirming && (
          <Button type="button" onClick={() => setConfirming(true)}>
            <HandCoins aria-hidden="true" />
            {t('balances.settle')}
          </Button>
        )
      }
      footer={
        due !== null &&
        (confirming || create.isError) && (
          <div className="flex flex-col gap-2">
            {confirming && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-11 whitespace-normal"
                  onClick={() => setConfirming(false)}
                  disabled={create.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  className="h-auto min-h-11 whitespace-normal"
                  onClick={() => settle(due)}
                  disabled={create.isPending}
                >
                  {t('balances.confirmSettle', { amount: format.amount(due) })}
                </Button>
              </div>
            )}
            {create.isError && (
              <p role="alert" className="text-sm text-destructive">
                {t('common.saveFailedPrefix')} {apiErrorMessage(create.error)}
              </p>
            )}
          </div>
        )
      }
    />
  );
}
