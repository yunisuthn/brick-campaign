import { CalendarDays, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CampaignRatesList, CampaignState } from './CampaignFacts.js';
import { type Campaign, useCampaigns } from './useCampaigns.js';

export function CampaignsPage() {
  const campaigns = useCampaigns();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader title={t('campaigns.title')} />
      <Button asChild className="sm:self-start">
        <Link to="/campagnes/nouvelle">
          <Plus aria-hidden="true" />
          {t('campaigns.newLink')}
        </Link>
      </Button>
      {campaigns.isPending && <LoadingList rows={2} />}
      {campaigns.isError && (
        <ErrorNote
          prefix={t('common.loadFailedPrefix')}
          message={apiErrorMessage(campaigns.error)}
        />
      )}
      {campaigns.isSuccess &&
        (campaigns.data.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t('campaigns.none')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {campaigns.data.map((campaign) => (
              <li key={campaign.id}>
                <CampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        ))}
    </Screen>
  );
}

/** One campaign at a glance; its name leads to the detail page. */
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const titleId = `campaign-${campaign.id}`;
  return (
    <article
      aria-labelledby={titleId}
      className="relative flex flex-col gap-2.5 rounded-xl border bg-card px-4 py-4 text-card-foreground shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h2 id={titleId} className="text-[17px] font-semibold">
            <Link
              to={`/campagnes/${campaign.id}`}
              className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {t('campaigns.cardTitle', { year: campaign.year, tranche: campaign.tranche })}
            </Link>
          </h2>
          <CampaignState campaign={campaign} />
        </div>
        <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
      </div>
      <CampaignRatesList campaign={campaign} />
    </article>
  );
}
