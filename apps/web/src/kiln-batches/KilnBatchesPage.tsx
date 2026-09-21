import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { StockSummary } from '../stock/StockSummary.js';
import { useStock } from '../stock/useStock.js';
import { type KilnBatch, useKilnBatches } from './useKilnBatches.js';

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
            <li key={batch.id}>
              <BatchRow batch={batch} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** A batch is in the kiln until it is unloaded; its cost waits on the rates it needs. */
function BatchRow({ batch }: { batch: KilnBatch }) {
  const { t } = useTranslation();
  return (
    <>
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
    </>
  );
}
