import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useDeliveries } from './useDeliveries.js';

/** The trips of one sale, shown on its page: a delivery always belongs to a sale. */
export function SaleDeliveries({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const deliveries = useDeliveries(campaignId, saleId);

  return (
    <section aria-labelledby="deliveries">
      <h2 id="deliveries">Livraisons</h2>
      <p>
        <Link to={`/ventes/${saleId}/livraisons/nouvelle`}>Ajouter un voyage</Link>
      </p>
      {deliveries.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(deliveries.error)}</p>
      )}
      {deliveries.isPending && <p role="status">Chargement…</p>}
      {deliveries.isSuccess &&
        (deliveries.data.length === 0 ? (
          <p>Aucun voyage effectué.</p>
        ) : (
          <ul className="rows">
            {deliveries.data.map((delivery) => (
              <li key={delivery.id}>
                <Link to={`/ventes/${saleId}/livraisons/${delivery.id}`} className="row-name">
                  {formatBricks(delivery.quantity)}
                </Link>
                <span className="sub">
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
