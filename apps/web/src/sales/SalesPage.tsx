import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { type Sale, SALE_STATUS_LABELS, useSales } from './useSales.js';

export function SalesPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Ventes{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign && (
        <p>
          <Link to="/ventes/nouvelle">Enregistrer une vente</Link>
        </p>
      )}
      {campaign ? (
        <SaleList campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant
          d’enregistrer une vente.
        </p>
      )}
    </main>
  );
}

function SaleList({ campaignId }: { campaignId: string }) {
  const sales = useSales(campaignId);
  const clients = useClients();

  const failed = [sales, clients].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">Chargement impossible : {failed.error && apiErrorMessage(failed.error)}</p>
    );
  if (!sales.isSuccess || !clients.isSuccess) return <p role="status">Chargement…</p>;
  if (sales.data.length === 0) return <p>Aucune vente enregistrée.</p>;

  const clientName = new Map(clients.data.map((client) => [client.id, client.name]));

  return (
    <ul className="rows">
      {sales.data.map((sale) => (
        <li key={sale.id} className="row-split">
          <span>
            <Link to={`/ventes/${sale.id}`} className="row-name">
              {clientName.get(sale.clientId) ?? 'Client inconnu'}
            </Link>
            <span className="sub">
              {formatDate(sale.date)} · {SALE_STATUS_LABELS[sale.status]} · {progress(sale)}
            </span>
          </span>
          <span className="figure">{formatAmount(sale.total)}</span>
        </li>
      ))}
    </ul>
  );
}

/** How much of the order has left the yard; a small surplus happens and is shown as it is. */
function progress(sale: Sale): string {
  if (sale.deliveredQuantity >= sale.orderedQuantity) {
    return `${formatBricks(sale.orderedQuantity)} livrées`;
  }
  return `${sale.deliveredQuantity.toLocaleString('fr-FR')} / ${formatBricks(sale.orderedQuantity)}`;
}
