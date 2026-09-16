import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { EXPENSE_CATEGORY_KEY, type ExpenseCategory } from '../expenses/useExpenses.js';
import { formatAmount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { StockSummary } from '../stock/StockSummary.js';
import { type Dashboard, useDashboard } from './useDashboard.js';

export function DashboardPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('dashboard.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year })}
      </h1>
      {campaign ? (
        <Overview campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('dashboard.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function Overview({ campaignId }: { campaignId: string }) {
  const dashboard = useDashboard(campaignId);
  const { t } = useTranslation();

  if (dashboard.isError) {
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(dashboard.error)}
      </p>
    );
  }
  if (!dashboard.isSuccess) return <p role="status">{t('common.loading')}</p>;
  const data = dashboard.data;

  return (
    <>
      <Result result={data.result} />
      <StockSummary stock={data.stock} />
      <Block title={t('dashboard.salesLabel')}>
        <Amount label={t('dashboard.revenue')} value={data.revenue} />
        <Amount label={t('dashboard.received')} value={data.received} />
        <Amount label={t('dashboard.outstandingReceivable')} value={data.outstanding} />
      </Block>
      <Block title={t('dashboard.labourLabel')}>
        <Amount label={t('dashboard.moulding')} value={data.labour.moulding} />
        <Amount label={t('dashboard.transport')} value={data.labour.transport} />
        <Amount label={t('dashboard.kilnLoading')} value={data.labour.kilnLoading} />
        <Amount label={t('dashboard.totalDue')} value={data.labour.total} />
        <Amount label={t('dashboard.paid')} value={data.labour.paid} />
        <Amount label={t('dashboard.outstandingPayable')} value={data.labour.outstanding} />
      </Block>
      <Block title={t('dashboard.expensesLabel')}>
        {categories(data).map(([category, amount]) => (
          <Amount key={category} label={t(EXPENSE_CATEGORY_KEY[category])} value={amount} />
        ))}
        <Amount label={t('dashboard.total')} value={data.expenses.total} />
        <Amount label={t('dashboard.deliveries')} value={data.deliveryCosts} />
      </Block>
    </>
  );
}

/** Only the categories with something in them; an empty one says nothing worth a line. */
function categories(data: Dashboard): [ExpenseCategory, number][] {
  return Object.entries(data.expenses.byCategory).filter(([, amount]) => amount > 0) as [
    ExpenseCategory,
    number,
  ][];
}

/**
 * The figure of the season, first on the screen. It is unknown while a rate the labour needs
 * is not fixed (reference document, section 4): the screen says so rather than showing a
 * result that counts unpaid work as free.
 */
function Result({ result }: { result: number | null }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t('dashboard.resultLabel')} className="card">
      <p className="sub">{t('dashboard.resultCaption')}</p>
      <p className="headline">
        {result === null ? (
          <em className="title-sub">{t('dashboard.resultUnknown')}</em>
        ) : (
          <span className={result < 0 ? 'bad' : 'done'}>{formatAmount(result)}</span>
        )}
      </p>
    </section>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      <dl className="facts">{children}</dl>
    </section>
  );
}

/** A figure the API could not compute for want of a rate reads "à fixer", never zero. */
function Amount({ label, value }: { label: string; value: number | null }) {
  const { t } = useTranslation();
  return (
    <>
      <dt>{label}</dt>
      <dd>{value === null ? <em>{t('dashboard.rateToFix')}</em> : formatAmount(value)}</dd>
    </>
  );
}
