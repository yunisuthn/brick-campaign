import { ChevronRight, Flame, Plus, Truck } from 'lucide-react';
import { Link } from 'react-router';
import { IconTile } from '@/components/marks';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { WORK_TYPE_KEY } from './contractorWorkFields.js';
import { useContractorWorks } from './useContractorWorks.js';

/**
 * The works of one batch, shown on its page: a work always belongs to a batch, so this is the
 * only place it is listed. Each opens in a sheet over the batch.
 */
export function BatchWorks({ campaignId, batchId }: { campaignId: string; batchId: string }) {
  const works = useContractorWorks(campaignId, { kilnBatchId: batchId });
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <SectionCard title={t('contractorWorks.sectionTitle')}>
      <div className="flex flex-col gap-3">
        {works.isError && (
          <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(works.error)} />
        )}
        {works.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {works.isSuccess &&
          (works.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('contractorWorks.noneAtAll')}</p>
          ) : (
            <ul className="divide-y">
              {works.data.map((work) => (
                <li key={work.id}>
                  <Link
                    to={`/lots/${batchId}/prestations/${work.id}`}
                    className="flex min-h-15 items-center gap-3 rounded-md py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <IconTile icon={work.type === 'transport' ? Truck : Flame} />
                    <span className="flex min-w-0 grow flex-col">
                      <span className="font-semibold">{work.contractorName}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {t(WORK_TYPE_KEY[work.type])} · {format.date(work.date)} ·{' '}
                        {format.bricks(work.quantity)}
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
          <Link to={`/lots/${batchId}/prestations/nouvelle`}>
            <Plus aria-hidden="true" />
            {t('contractorWorks.addLink')}
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}
