import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { Meter } from '@/components/marks';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import type { Sale } from '../sales/useSales.js';
import { useSalePayments } from './useSalePayments.js';

/**
 * What the client has handed over so far, on the page of the sale. A client pays as the trips
 * go (reference document, section 10.5), so this is a list and not a single figure; what is
 * still owed is spelled out above it, since that is the question the page is opened for.
 */
export function SalePayments({ sale }: { sale: Sale }) {
  const payments = useSalePayments(sale.campaignId, sale.id);
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <SectionCard title={t('salePayments.sectionTitle')}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Meter
            ratio={sale.total === 0 ? 0 : sale.receivedAmount / sale.total}
            className="bg-success"
          />
          <p className="text-sm tabular-nums">
            {t('salePayments.receivedLine', {
              received: format.amount(sale.receivedAmount),
              total: format.amount(sale.total),
            })}
            {sale.outstanding > 0 &&
              t('salePayments.outstandingSuffix', {
                outstanding: format.amount(sale.outstanding),
              })}
            .
          </p>
        </div>
        {payments.isError && (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={apiErrorMessage(payments.error)}
          />
        )}
        {payments.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {payments.isSuccess &&
          (payments.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('salePayments.noneAtAll')}</p>
          ) : (
            <ul className="divide-y">
              {payments.data.map((payment) => (
                <li key={payment.id}>
                  <Link
                    to={`/ventes/${sale.id}/encaissements/${payment.id}`}
                    className="flex min-h-13 items-center gap-3 rounded-md py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <span className="grow text-sm text-muted-foreground">
                      {format.date(payment.date)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {format.amount(payment.amount)}
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
        {sale.outstanding > 0 && (
          <Button asChild variant="outline">
            <Link to={`/ventes/${sale.id}/encaissements/nouveau`}>
              <Plus aria-hidden="true" />
              {t('salePayments.addPaymentLink')}
            </Link>
          </Button>
        )}
      </div>
    </SectionCard>
  );
}
