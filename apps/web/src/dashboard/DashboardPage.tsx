import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../expenses/useExpenses.js';
import { formatAmount } from '../format.js';
import { StockSummary } from '../stock/StockSummary.js';
import { type Dashboard, useDashboard } from './useDashboard.js';

export function DashboardPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Tableau de bord{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign ? (
        <Overview campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> pour suivre la
          saison.
        </p>
      )}
    </main>
  );
}

function Overview({ campaignId }: { campaignId: string }) {
  const dashboard = useDashboard(campaignId);

  if (dashboard.isError) {
    return <p role="alert">Chargement impossible : {apiErrorMessage(dashboard.error)}</p>;
  }
  if (!dashboard.isSuccess) return <p role="status">Chargement…</p>;
  const data = dashboard.data;

  return (
    <>
      <Result result={data.result} />
      <StockSummary stock={data.stock} />
      <Block title="Ventes">
        <Amount label="Chiffre d’affaires" value={data.revenue} />
        <Amount label="Encaissé" value={data.received} />
        <Amount label="Reste à encaisser" value={data.outstanding} />
      </Block>
      <Block title="Main-d’œuvre">
        <Amount label="Moulage" value={data.labour.moulding} />
        <Amount label="Transport" value={data.labour.transport} />
        <Amount label="Enfournement" value={data.labour.kilnLoading} />
        <Amount label="Total dû" value={data.labour.total} />
        <Amount label="Versé" value={data.labour.paid} />
        <Amount label="Reste à verser" value={data.labour.outstanding} />
      </Block>
      <Block title="Dépenses">
        {categories(data).map(([category, amount]) => (
          <Amount key={category} label={EXPENSE_CATEGORY_LABELS[category]} value={amount} />
        ))}
        <Amount label="Total" value={data.expenses.total} />
        <Amount label="Livraisons" value={data.deliveryCosts} />
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
  return (
    <section aria-label="Résultat" className="card">
      <p className="sub">Résultat de la campagne</p>
      <p className="headline">
        {result === null ? (
          <em className="title-sub">Inconnu tant qu’un tarif n’est pas fixé</em>
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
  return (
    <>
      <dt>{label}</dt>
      <dd>{value === null ? <em>Tarif à fixer</em> : formatAmount(value)}</dd>
    </>
  );
}
