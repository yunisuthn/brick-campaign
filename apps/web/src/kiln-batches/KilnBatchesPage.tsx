import { Flame, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { AmountRow } from '@/components/AmountRow';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { ToneBadge } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { StockCard } from '@/components/StockCard';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { useStock } from '../stock/useStock.js';
import { type KilnBatch, useCancelKilnBatch, useKilnBatches } from './useKilnBatches.js';

/** The stock, then a card per batch; loading a batch opens in a sheet over the list. */
export function KilnBatchesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('kilnBatches.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <Batches campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="kilnBatches.noCampaignSuffix" />
      )}
      <Outlet />
    </Screen>
  );
}

function Batches({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const batches = useKilnBatches(campaignId);
  const { t } = useTranslation();

  const failed = [stock, batches].find((query) => query.isError);
  if (failed)
    return (
      <ErrorNote
        prefix={t('common.loadFailedPrefix')}
        message={failed.error && apiErrorMessage(failed.error)}
      />
    );
  if (!stock.isSuccess || !batches.isSuccess) return <LoadingList />;

  return (
    <>
      <StockCard stock={stock.data} />
      <Button asChild className="sm:self-start">
        <Link to="/lots/nouveau">
          <Flame aria-hidden="true" />
          {t('kilnBatches.newLink')}
        </Link>
      </Button>
      {batches.data.length === 0 ? (
        <EmptyState icon={Flame} title={t('kilnBatches.noneAtAll')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {batches.data.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * A batch is in the kiln until it is unloaded; its cost waits on the rates it needs. Editing
 * opens the batch's own page; deleting is a soft cancel done right here, behind the red strip,
 * as for a versement.
 */
function BatchCard({ batch }: { batch: KilnBatch }) {
  const cancel = useCancelKilnBatch(batch.campaignId, batch.id);
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
  const fired = batch.unloadedOn !== null;

  return (
    <li>
      <Card className="gap-2.5 px-4 py-4">
        <Link
          to={`/lots/${batch.id}`}
          className="flex flex-col gap-1.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {format.bricks(batch.quantity)}
            </span>
            <ToneBadge tone={fired ? 'brick' : 'warning'}>
              {t(fired ? 'dashboard.stock.fired' : 'dashboard.stock.inKiln')}
            </ToneBadge>
          </span>
          <span className="text-sm text-muted-foreground">
            {t('kilnBatches.loadedOnMessage', { date: format.date(batch.loadedOn) })} ·{' '}
            {batch.unloadedOn === null
              ? t('kilnBatches.stillInKiln')
              : t('kilnBatches.unloadedOnMessage', { date: format.date(batch.unloadedOn) })}
          </span>
        </Link>
        <dl>
          <AmountRow
            label={t('kilnBatches.costLabel').replace(/\s*:$/, '')}
            value={batch.cost.total}
            unknownLabel={t('kilnBatches.rateToFix')}
          />
        </dl>
        {confirming ? (
          <ConfirmStrip
            confirmLabel={t('kilnBatches.row.confirmDelete')}
            keepLabel={t('common.keep')}
            onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })}
            onKeep={() => setConfirming(false)}
            busy={cancel.isPending}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <Link to={`/lots/${batch.id}`}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" />
              {t('common.delete')}
            </Button>
          </div>
        )}
        {cancel.isError && (
          <p role="alert" className="text-sm text-destructive">
            {apiErrorMessage(cancel.error)}
          </p>
        )}
      </Card>
    </li>
  );
}
