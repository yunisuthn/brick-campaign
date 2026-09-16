import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useDeliveries } from './useDeliveries.js';

/** The trips of one sale, shown on its page: a delivery always belongs to a sale. */
export function SaleDeliveries({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const deliveries = useDeliveries(campaignId, saleId);
  const { t } = useTranslation();

  return (
    <section aria-labelledby="deliveries">
      <h2 id="deliveries">{t('deliveries.sectionTitle')}</h2>
      <p>
        <Link to={`/ventes/${saleId}/livraisons/nouvelle`}>{t('deliveries.addTrip')}</Link>
      </p>
      {deliveries.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(deliveries.error)}
        </p>
      )}
      {deliveries.isPending && <p role="status">{t('common.loading')}</p>}
      {deliveries.isSuccess &&
        (deliveries.data.length === 0 ? (
          <p>{t('deliveries.noneAtAll')}</p>
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
