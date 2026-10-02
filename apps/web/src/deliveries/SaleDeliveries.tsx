import { ChevronRight, Plus, Truck } from 'lucide-react';
import { Link } from 'react-router';
import { IconTile } from '@/components/marks';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useDeliveries } from './useDeliveries.js';

/** The trips of one sale, shown on its page: a delivery always belongs to a sale. */
export function SaleDeliveries({ campaignId, saleId }: { campaignId: string; saleId: string }) {
  const deliveries = useDeliveries(campaignId, saleId);
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <SectionCard title={t('deliveries.sectionTitle')}>
      <div className="flex flex-col gap-3">
        {deliveries.isError && (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={apiErrorMessage(deliveries.error)}
          />
        )}
        {deliveries.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {deliveries.isSuccess &&
          (deliveries.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('deliveries.noneAtAll')}</p>
          ) : (
            <ul className="divide-y">
              {deliveries.data.map((delivery) => (
                <li key={delivery.id}>
                  <Link
                    to={`/ventes/${saleId}/livraisons/${delivery.id}`}
                    className="flex min-h-14 items-center gap-3 rounded-md py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <IconTile icon={Truck} />
                    <span className="flex min-w-0 grow flex-col">
                      <span className="font-semibold tabular-nums">
                        {format.bricks(delivery.quantity)}
                      </span>
                      <span className="text-[13px] text-muted-foreground">
                        {format.date(delivery.date)} · {format.amount(delivery.cost)}
                        {delivery.plate !== null && ` · ${delivery.plate}`}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-[18px] shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        <Button asChild variant="outline">
          <Link to={`/ventes/${saleId}/livraisons/nouvelle`}>
            <Plus aria-hidden="true" />
            {t('deliveries.addTrip')}
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}
