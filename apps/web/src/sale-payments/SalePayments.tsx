import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { Sale } from '../sales/useSales.js';
import { useSalePayments } from './useSalePayments.js';

/**
 * What the client has handed over so far, on the page of the sale. A client pays as the trips
 * go (reference document, section 10.5), so this is a list and not a single figure; what is
 * still owed is spelled out under it, since that is the question the page is opened for.
 */
export function SalePayments({ sale }: { sale: Sale }) {
  const payments = useSalePayments(sale.campaignId, sale.id);
  const { t } = useTranslation();

  return (
    <section aria-labelledby="payments">
      <h2 id="payments">{t('salePayments.sectionTitle')}</h2>
      <p>
        {t('salePayments.receivedLine', {
          received: formatAmount(sale.receivedAmount),
          total: formatAmount(sale.total),
        })}
        {sale.outstanding > 0 &&
          t('salePayments.outstandingSuffix', { outstanding: formatAmount(sale.outstanding) })}
        .
      </p>
      {sale.outstanding > 0 && (
        <p>
          <Link to={`/ventes/${sale.id}/encaissements/nouveau`}>
            {t('salePayments.addPaymentLink')}
          </Link>
        </p>
      )}
      {payments.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(payments.error)}
        </p>
      )}
      {payments.isPending && <p role="status">{t('common.loading')}</p>}
      {payments.isSuccess &&
        (payments.data.length === 0 ? (
          <p>{t('salePayments.noneAtAll')}</p>
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
