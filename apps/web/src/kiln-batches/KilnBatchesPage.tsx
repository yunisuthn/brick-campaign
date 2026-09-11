import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatBricks, formatDate } from '../format.js';
import { StockSummary } from '../stock/StockSummary.js';
import { useStock } from '../stock/useStock.js';
import { type KilnBatch, useKilnBatches } from './useKilnBatches.js';

export function KilnBatchesPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Lots de cuisson{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign ? (
        <Batches campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant
          d’enfourner.
        </p>
      )}
    </main>
  );
}

function Batches({ campaignId }: { campaignId: string }) {
  const stock = useStock(campaignId);
  const batches = useKilnBatches(campaignId);

  const failed = [stock, batches].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">Chargement impossible : {failed.error && apiErrorMessage(failed.error)}</p>
    );
  if (!stock.isSuccess || !batches.isSuccess) return <p role="status">Chargement…</p>;

  return (
    <>
      <StockSummary stock={stock.data} />
      <p>
        <Link to="/lots/nouveau">Enfourner un lot</Link>
      </p>
      {batches.data.length === 0 ? (
        <p>Aucun lot enfourné.</p>
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
  return (
    <>
      <Link to={`/lots/${batch.id}`} className="row-name">
        {formatBricks(batch.quantity)}
      </Link>
      <span className="sub">
        Enfourné le {formatDate(batch.loadedOn)} ·{' '}
        {batch.unloadedOn === null
          ? 'encore au four'
          : `défourné le ${formatDate(batch.unloadedOn)}`}
      </span>
      <span className="sub">
        Coût :{' '}
        {batch.cost.total === null ? (
          <em>tarif de prestation à fixer</em>
        ) : (
          formatAmount(batch.cost.total)
        )}
      </span>
    </>
  );
}
