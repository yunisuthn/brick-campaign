import { Plus, ShoppingCart } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { ListCard } from '@/components/ListCard';
import { Meter, ToneBadge } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useClients } from '../clients/useClients.js';
import { formatCount } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { type Sale, SALE_STATUS_KEY, SALE_STATUS_TONE, useSales } from './useSales.js';

/** The sales of the current campaign; a new one opens in a sheet over the list (section 10.12). */
export function SalesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('sales.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <>
          <Button asChild className="sm:self-start">
            <Link to="/ventes/nouvelle">
              <Plus aria-hidden="true" />
              {t('sales.newLink')}
            </Link>
          </Button>
          <SaleList campaignId={campaign.id} />
        </>
      ) : (
        <NoCampaign suffix="sales.noCampaignSuffix" />
      )}
      <Outlet />
    </Screen>
  );
}

function SaleList({ campaignId }: { campaignId: string }) {
  const sales = useSales(campaignId);
  const clients = useClients();
  const { t } = useTranslation();

  const failed = [sales, clients].find((query) => query.isError);
  if (failed)
    return (
      <ErrorNote
        prefix={t('common.loadFailedPrefix')}
        message={failed.error && apiErrorMessage(failed.error)}
      />
    );
  if (!sales.isSuccess || !clients.isSuccess) return <LoadingList />;
  if (sales.data.length === 0) {
    return <EmptyState icon={ShoppingCart} title={t('sales.noneAtAll')} />;
  }

  const clientName = new Map(clients.data.map((client) => [client.id, client.name]));
  return (
    <ListCard label={t('sales.title')}>
      {sales.data.map((sale) => (
        <SaleRow
          key={sale.id}
          sale={sale}
          client={clientName.get(sale.clientId) ?? t('sales.unknownClient')}
        />
      ))}
    </ListCard>
  );
}

/** The client and the total, then the date and the status, then how much has left the yard. */
function SaleRow({ sale, client }: { sale: Sale; client: string }) {
  const { t } = useTranslation();
  const format = useFormat();
  const complete = sale.deliveredQuantity >= sale.orderedQuantity;
  return (
    <li>
      <Link
        to={`/ventes/${sale.id}`}
        className="flex flex-col gap-2 rounded-xl px-4 py-3.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">{client}</span>
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {format.amount(sale.total)}
          </span>
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground">{format.date(sale.date)}</span>
          <ToneBadge tone={SALE_STATUS_TONE[sale.status]}>
            {t(SALE_STATUS_KEY[sale.status])}
          </ToneBadge>
        </span>
        <Meter
          ratio={sale.orderedQuantity === 0 ? 0 : sale.deliveredQuantity / sale.orderedQuantity}
          className={complete ? undefined : 'bg-stock-kiln'}
        />
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {complete
            ? t('sales.progressComplete', { quantity: format.bricks(sale.orderedQuantity) })
            : t('sales.progressPartial', {
                delivered: formatCount(sale.deliveredQuantity),
                ordered: format.bricks(sale.orderedQuantity),
              })}
        </span>
      </Link>
    </li>
  );
}
