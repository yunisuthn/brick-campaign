import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { AmountRow } from '@/components/AmountRow';
import { NewSaleSheet } from '@/components/NewSaleSheet';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StockCard } from '@/components/StockCard';
import { ToneBadge } from '@/components/marks';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from '../api/errorMessages.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Dashboard, useDashboard } from './useDashboard.js';

export function DashboardPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
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
    </Screen>
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
            <ToneBadge tone={loss ? 'destructive' : 'success'}>
              {t(loss ? 'dashboard.deficit' : 'dashboard.profit')}
            </ToneBadge>
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
