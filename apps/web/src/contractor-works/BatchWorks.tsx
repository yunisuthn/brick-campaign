import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { formatBricks, formatDate } from '../format.js';
import { WORK_TYPE_LABELS, useContractorWorks } from './useContractorWorks.js';

/**
 * The works of one batch, shown on its page: a work always belongs to a batch, so this is the
 * only place it is listed.
 */
export function BatchWorks({ campaignId, batchId }: { campaignId: string; batchId: string }) {
  const works = useContractorWorks(campaignId, { kilnBatchId: batchId });

  return (
    <section aria-labelledby="works">
      <h2 id="works" style={{ fontSize: '1.125rem' }}>
        Prestations
      </h2>
      <p>
        <Link to={`/lots/${batchId}/prestations/nouvelle`}>Ajouter une prestation</Link>
      </p>
      {works.isError && <p role="alert">Chargement impossible : {apiErrorMessage(works.error)}</p>}
      {works.isPending && <p role="status">Chargement…</p>}
      {works.isSuccess &&
        (works.data.length === 0 ? (
          <p>Aucune prestation sur ce lot.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {works.data.map((work) => (
              <li key={work.id} style={{ marginBottom: '0.5rem' }}>
                <Link to={`/prestations/${work.id}`} style={{ fontWeight: 'bold' }}>
                  {work.contractorName}
                </Link>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>
                  {WORK_TYPE_LABELS[work.type]} · {formatDate(work.date)} ·{' '}
                  {formatBricks(work.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
