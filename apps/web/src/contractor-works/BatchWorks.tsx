import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { WORK_TYPE_KEY } from './contractorWorkFields.js';
import { formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useContractorWorks } from './useContractorWorks.js';

/**
 * The works of one batch, shown on its page: a work always belongs to a batch, so this is the
 * only place it is listed.
 */
export function BatchWorks({ campaignId, batchId }: { campaignId: string; batchId: string }) {
  const works = useContractorWorks(campaignId, { kilnBatchId: batchId });
  const { t } = useTranslation();

  return (
    <section aria-labelledby="works">
      <h2 id="works">{t('contractorWorks.sectionTitle')}</h2>
      <p>
        <Link to={`/lots/${batchId}/prestations/nouvelle`}>{t('contractorWorks.addLink')}</Link>
      </p>
      {works.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(works.error)}
        </p>
      )}
      {works.isPending && <p role="status">{t('common.loading')}</p>}
      {works.isSuccess &&
        (works.data.length === 0 ? (
          <p>{t('contractorWorks.noneAtAll')}</p>
        ) : (
          <ul className="rows">
            {works.data.map((work) => (
              <li key={work.id}>
                <Link to={`/prestations/${work.id}`} className="row-name">
                  {work.contractorName}
                </Link>
                <span className="sub">
                  {t(WORK_TYPE_KEY[work.type])} · {formatDate(work.date)} ·{' '}
                  {formatBricks(work.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
