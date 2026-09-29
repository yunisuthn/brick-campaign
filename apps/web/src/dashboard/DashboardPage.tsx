import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { AmountRow } from '@/components/AmountRow';
import { NewSaleSheet } from '@/components/NewSaleSheet';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from '../api/errorMessages.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks, formatCount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { Stock } from '../stock/useStock.js';
import { type Dashboard, useDashboard } from './useDashboard.js';

export function DashboardPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="ui mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-5 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        {campaign && (
          <p className="text-sm text-muted-foreground">
            {t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })}
          </p>
        )}
      </div>
      {campaign ? (
        <Overview campaign={campaign} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle" className="text-primary underline underline-offset-4">
            {t('common.noCampaignLinkText')}
          </Link>
          {t('dashboard.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function Overview({ campaign }: { campaign: Campaign }) {
  const dashboard = useDashboard(campaign.id);
  const { t } = useTranslation();

  if (dashboard.isError) {
    return (
      <p role="alert" className="text-destructive">
        {t('common.loadFailedPrefix')} {apiErrorMessage(dashboard.error)}
      </p>
    );
  }
  if (!dashboard.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }
  const data = dashboard.data;

  return (
    <>
      <ResultCard result={data.result} received={data.received} />
      <StockCard stock={data.stock} />
      <SectionCard title={t('dashboard.salesLabel')} action={<NewSaleSheet campaign={campaign} />}>
        <dl>
          <AmountRow label={t('dashboard.revenue')} value={data.revenue} />
          <AmountRow label={t('dashboard.received')} value={data.received} />
          <AmountRow label={t('dashboard.outstandingReceivable')} value={data.outstanding} strong />
        </dl>
      </SectionCard>
      <LabourCard labour={data.labour} />
      <ExpensesCard total={data.expenses.total} deliveryCosts={data.deliveryCosts} />
    </>
  );
}

/**
 * The figure of the season, first on the screen. It is unknown while a rate the labour needs
 * is not fixed (reference document, section 4): the screen says so rather than showing a
 * result that counts unpaid work as free. The result is worked out on what was received, not
 * on what was sold, so the line under it breaks it down that way: the costs are the received
 * amount less the result, two figures of the API (section 10.11).
 */
function ResultCard({ result, received }: { result: number | null; received: number }) {
  const { t } = useTranslation();
  const loss = result !== null && result < 0;

  return (
    <SectionCard title={t('dashboard.resultCaption')}>
      {result === null ? (
        <p className="text-muted-foreground italic">{t('dashboard.resultUnknown')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={cn(
                'text-3xl font-bold tracking-tight tabular-nums',
                loss ? 'text-destructive' : 'text-success',
              )}
            >
              {formatAmount(result)}
            </p>
            <Badge
              variant="outline"
              className={cn(
                'border-transparent',
                loss ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
              )}
            >
              {t(loss ? 'dashboard.deficit' : 'dashboard.profit')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('dashboard.resultBreakdown', {
              received: formatAmount(received),
              costs: formatAmount(received - result),
            })}
          </p>
        </div>
      )}
    </SectionCard>
  );
}

const levels = [
  { key: 'raw', label: 'dashboard.stock.raw', swatch: 'bg-stock-raw' },
  { key: 'inKiln', label: 'dashboard.stock.inKiln', swatch: 'bg-stock-kiln' },
  { key: 'fired', label: 'dashboard.stock.fired', swatch: 'bg-stock-fired' },
] as const;

/** The three levels the owner counts, and how the bricks on hand split between them. */
function StockCard({ stock }: { stock: Stock }) {
  const { t } = useTranslation();
  const onHand = stock.raw + stock.inKiln + stock.fired;

  return (
    <SectionCard title={t('dashboard.stock.title')}>
      <dl className="grid grid-cols-3 gap-2">
        {levels.map((level) => (
          <StatCard
            key={level.key}
            label={t(level.label)}
            value={formatCount(stock[level.key])}
            swatchClassName={level.swatch}
          />
        ))}
      </dl>
      {onHand === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.stock.empty')}</p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {levels.map((level) =>
              stock[level.key] > 0 ? (
                <div
                  key={level.key}
                  className={level.swatch}
                  style={{ width: `${(stock[level.key] / onHand) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('dashboard.stock.summary', {
              fired: formatBricks(stock.fired),
              total: formatBricks(onHand),
            })}
          </p>
        </>
      )}
    </SectionCard>
  );
}

/**
 * What the work cost, what was paid out, and what is left. Paid beyond what is owed is not a
 * negative balance to show but money handed out ahead: it reads as an advance to the workers
 * (section 10.11), paid less owed.
 */
function LabourCard({ labour }: { labour: Dashboard['labour'] }) {
  const { t } = useTranslation();
  const rateToFix = t('dashboard.rateToFix');
  const advance =
    labour.total !== null && labour.paid > labour.total ? labour.paid - labour.total : null;

  return (
    <SectionCard title={t('dashboard.labourLabel')}>
      <dl>
        <AmountRow
          label={t('dashboard.moulding')}
          value={labour.moulding}
          unknownLabel={rateToFix}
        />
        <AmountRow
          label={t('dashboard.transport')}
          value={labour.transport}
          unknownLabel={rateToFix}
        />
        <AmountRow
          label={t('dashboard.kilnLoading')}
          value={labour.kilnLoading}
          unknownLabel={rateToFix}
        />
      </dl>
      <Separator className="my-2" />
      <dl>
        <AmountRow
          label={t('dashboard.totalDue')}
          value={labour.total}
          unknownLabel={rateToFix}
          strong
        />
        <AmountRow label={t('dashboard.paid')} value={labour.paid} />
        {advance === null && (
          <AmountRow
            label={t('dashboard.outstandingPayable')}
            value={labour.outstanding}
            unknownLabel={rateToFix}
          />
        )}
      </dl>
      {advance !== null && (
        <div
          role="note"
          className="mt-3 rounded-lg border border-warning-border bg-warning-surface px-3 py-2.5 text-warning-foreground"
        >
          <dl>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold">{t('dashboard.advanceTitle')}</dt>
              <dd className="text-right font-semibold tabular-nums">{formatAmount(advance)}</dd>
            </div>
          </dl>
          <p className="mt-0.5 text-sm">{t('dashboard.advanceNote')}</p>
        </div>
      )}
    </SectionCard>
  );
}

/** The whole card leads to the expense list, where the detail by category lives. */
function ExpensesCard({ total, deliveryCosts }: { total: number; deliveryCosts: number }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/depenses"
      className="group block rounded-xl transition-shadow outline-none hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <SectionCard
        title={t('dashboard.expensesLabel')}
        action={
          <ChevronRight
            aria-hidden="true"
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        }
      >
        <dl>
          <AmountRow label={t('dashboard.total')} value={total} strong />
          <AmountRow label={t('dashboard.deliveries')} value={deliveryCosts} />
        </dl>
      </SectionCard>
    </Link>
  );
}
