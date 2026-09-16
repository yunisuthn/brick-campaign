import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Sale, SALE_STATUS_KEY, useSales } from './useSales.js';

export function SalesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('sales.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year })}
      </h1>
      {campaign && (
        <p>
          <Link to="/ventes/nouvelle">{t('sales.newLink')}</Link>
        </p>
      )}
      {campaign ? (
        <SaleList campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('sales.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function SaleList({ campaignId }: { campaignId: string }) {
  const sales = useSales(campaignId);
  const clients = useClients();
  const { t } = useTranslation();

  const failed = [sales, clients].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!sales.isSuccess || !clients.isSuccess) return <p role="status">{t('common.loading')}</p>;
  if (sales.data.length === 0) return <p>{t('sales.noneAtAll')}</p>;

  const clientName = new Map(clients.data.map((client) => [client.id, client.name]));

  return (
    <ul className="rows">
      {sales.data.map((sale) => (
        <li key={sale.id} className="row-split">
          <span>
            <Link to={`/ventes/${sale.id}`} className="row-name">
              {clientName.get(sale.clientId) ?? t('sales.unknownClient')}
            </Link>
            <span className="sub">
              {formatDate(sale.date)} · {t(SALE_STATUS_KEY[sale.status])} · {progress(sale, t)}
            </span>
          </span>
          <span className="figure">{formatAmount(sale.total)}</span>
        </li>
      ))}
    </ul>
  );
}

/** How much of the order has left the yard; a small surplus happens and is shown as it is. */
function progress(sale: Sale, t: ReturnType<typeof useTranslation>['t']): string {
  if (sale.deliveredQuantity >= sale.orderedQuantity) {
    return t('sales.progressComplete', { quantity: formatBricks(sale.orderedQuantity) });
  }
  return t('sales.progressPartial', {
    delivered: sale.deliveredQuantity.toLocaleString('fr-FR'),
    ordered: formatBricks(sale.orderedQuantity),
  });
}
