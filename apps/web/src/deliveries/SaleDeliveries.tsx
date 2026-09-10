import { Link } from 'react-router';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useDeliveries } from './useDeliveries.js';

/** The trips of one sale, shown on its page: a delivery always belongs to a sale. */
export function SaleDeliveries({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const deliveries = useDeliveries(campaignId, saleId);

  return (
    <section aria-labelledby="deliveries" style={{ marginTop: '1.5rem' }}>
      <h2 id="deliveries" style={{ fontSize: '1.125rem' }}>
        Livraisons
      </h2>
      <p>
        <Link to={`/ventes/${saleId}/livraisons/nouvelle`}>Ajouter un voyage</Link>
      </p>
      {deliveries.isError && <p role="alert">Chargement impossible : {deliveries.error.message}</p>}
      {deliveries.isPending && <p role="status">Chargement…</p>}
      {deliveries.isSuccess &&
        (deliveries.data.length === 0 ? (
          <p>Aucun voyage effectué.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {deliveries.data.map((delivery) => (
              <li key={delivery.id} style={{ marginBottom: '0.5rem' }}>
                <Link
                  to={`/ventes/${saleId}/livraisons/${delivery.id}`}
                  style={{ fontWeight: 'bold' }}
                >
                  {formatBricks(delivery.quantity)}
                </Link>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>
                  {formatDate(delivery.date)} · {formatAmount(delivery.cost)}
                  {delivery.plate !== null && ` · ${delivery.plate}`}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
