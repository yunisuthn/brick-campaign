import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { StockSummary } from '../stock/StockSummary.js';
import { useStock } from '../stock/useStock.js';
import { type KilnBatch, useCancelKilnBatch, useKilnBatches } from './useKilnBatches.js';

export function KilnBatchesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('kilnBatches.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year, tranche: campaign.tranche })}
      </h1>
      {campaign ? (
        <Batches campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('kilnBatches.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function Batches({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const batches = useKilnBatches(campaignId);
  const { t } = useTranslation();

  const failed = [stock, batches].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!stock.isSuccess || !batches.isSuccess) return <p role="status">{t('common.loading')}</p>;

  return (
    <>
      <StockSummary stock={stock.data} />
      <p>
        <Link to="/lots/nouveau">{t('kilnBatches.newLink')}</Link>
      </p>
      {batches.data.length === 0 ? (
        <p>{t('kilnBatches.noneAtAll')}</p>
      ) : (
        <ul className="rows">
          {batches.data.map((batch) => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * A batch is in the kiln until it is unloaded; its cost waits on the rates it needs. Editing
 * opens the batch's own page; deleting is a soft cancel done right here, behind a second click,
 * as for a versement.
 */
function BatchRow({ batch }: { batch: KilnBatch }) {
  const cancel = useCancelKilnBatch(batch.campaignId, batch.id);
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  return (
    <li>
      <Link to={`/lots/${batch.id}`} className="row-name">
        {formatBricks(batch.quantity)}
      </Link>
      <span className="sub">
        {t('kilnBatches.loadedOnMessage', { date: formatDate(batch.loadedOn) })} ·{' '}
        {batch.unloadedOn === null
          ? t('kilnBatches.stillInKiln')
          : t('kilnBatches.unloadedOnMessage', { date: formatDate(batch.unloadedOn) })}
      </span>
      <span className="sub">
        {t('kilnBatches.costLabel')}{' '}
        {batch.cost.total === null ? (
          <em>{t('kilnBatches.rateToFix')}</em>
        ) : (
          formatAmount(batch.cost.total)
        )}
      </span>
      <span className="sub">
        {confirming ? (
          <>
            <button
              type="button"
              className="link-button"
              onClick={() => cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })}
              disabled={cancel.isPending}
            >
              {t('kilnBatches.row.confirmDelete')}
            </button>{' '}
            ·{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => setConfirming(false)}
              disabled={cancel.isPending}
            >
              {t('common.keep')}
            </button>
          </>
        ) : (
          <>
            <Link to={`/lots/${batch.id}`}>{t('common.edit')}</Link> ·{' '}
            <button type="button" className="link-button" onClick={() => setConfirming(true)}>
              {t('common.delete')}
            </button>
          </>
        )}
      </span>
      {cancel.isError && <p role="alert">{apiErrorMessage(cancel.error)}</p>}
    </li>
  );
}
