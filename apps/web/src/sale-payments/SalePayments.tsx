import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatAmount, formatDate } from '../format.js';
import type { Sale } from '../sales/useSales.js';
import { useSalePayments } from './useSalePayments.js';

/**
 * What the client has handed over so far, on the page of the sale. A client pays as the trips
 * go (reference document, section 10.5), so this is a list and not a single figure; what is
 * still owed is spelled out under it, since that is the question the page is opened for.
 */
export function SalePayments({ sale }: { sale: Sale }) {
  const payments = useSalePayments(sale.campaignId, sale.id);

  return (
    <section aria-labelledby="payments">
      <h2 id="payments">Encaissements</h2>
      <p>
        {formatAmount(sale.receivedAmount)} reçus sur {formatAmount(sale.total)}
        {sale.outstanding > 0 && `, reste ${formatAmount(sale.outstanding)} à encaisser`}.
      </p>
      {sale.outstanding > 0 && (
        <p>
          <Link to={`/ventes/${sale.id}/encaissements/nouveau`}>Encaisser un versement</Link>
        </p>
      )}
      {payments.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(payments.error)}</p>
      )}
      {payments.isPending && <p role="status">Chargement…</p>}
      {payments.isSuccess &&
        (payments.data.length === 0 ? (
          <p>Rien reçu pour le moment.</p>
        ) : (
          <ul className="rows">
            {payments.data.map((payment) => (
              <li key={payment.id}>
                <Link to={`/ventes/${sale.id}/encaissements/${payment.id}`} className="row-name">
                  {formatAmount(payment.amount)}
                </Link>
                <span className="sub">{formatDate(payment.date)}</span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
