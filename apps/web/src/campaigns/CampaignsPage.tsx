import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CampaignFacts } from './CampaignFacts.js';
import { type Campaign, useCampaigns } from './useCampaigns.js';

export function CampaignsPage() {
  const campaigns = useCampaigns();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>{t('campaigns.title')}</h1>
      <p>
        <Link to="/campagnes/nouvelle">{t('campaigns.newLink')}</Link>
      </p>
      {campaigns.isPending && <p role="status">{t('common.loading')}</p>}
      {campaigns.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(campaigns.error)}
        </p>
      )}
      {campaigns.isSuccess &&
        (campaigns.data.length === 0 ? (
          <p>{t('campaigns.none')}</p>
        ) : (
          <ul className="rows">
            {campaigns.data.map((campaign) => (
              <li key={campaign.id}>
                <CampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}

/** One campaign at a glance; its year leads to the detail page. */
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  return (
    <article aria-labelledby={`campaign-${campaign.id}`} className="card">
      <h2 id={`campaign-${campaign.id}`}>
        <Link to={`/campagnes/${campaign.id}`}>{t('campaigns.cardTitle', { year: campaign.year })}</Link>
      </h2>
      <CampaignFacts campaign={campaign} />
    </article>
  );
}
