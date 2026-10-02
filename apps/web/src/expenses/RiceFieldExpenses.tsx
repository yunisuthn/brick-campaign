import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ListRow } from '@/components/ListCard';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { EXPENSE_CATEGORY_KEY, useExpenses } from './useExpenses.js';

/**
 * What a rice field costs on the current campaign, summed from the expenses attached to it.
 * The cost is not a field of the rice field (reference document, section 3): a rice field is
 * reference data shared between campaigns, while a contract is paid season by season, so the
 * amount lives where it can differ from one year to the next.
 */
export function RiceFieldExpenses({ riceFieldId }: { riceFieldId: string }) {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();
  const title = `${t('expenses.costOnCampaign')}${
    campaign
      ? ` ${campaign.year}${t('campaigns.trancheSuffix', { tranche: campaign.tranche })}`
      : ''
  }`;

  if (!campaign) {
    return (
      <SectionCard title={title}>
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      </SectionCard>
    );
  }
  return <Linked title={title} campaignId={campaign.id} riceFieldId={riceFieldId} />;
}

function Linked({
  title,
  campaignId,
  riceFieldId,
}: {
  title: string;
  campaignId: string;
  riceFieldId: string;
}) {
  const expenses = useExpenses(campaignId, { riceFieldId });
  const addPath = `/depenses/nouvelle?category=rice_field&riceFieldId=${riceFieldId}`;
  const { t } = useTranslation();
  const format = useFormat();

  const total = expenses.isSuccess
    ? expenses.data.reduce((sum, expense) => sum + expense.amount, 0)
    : null;

  return (
    <SectionCard
      title={title}
      action={
        total !== null && (
          <span className="text-lg font-bold tabular-nums">{format.amount(total)}</span>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {expenses.isError && (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={apiErrorMessage(expenses.error)}
          />
        )}
        {expenses.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {expenses.isSuccess &&
          (expenses.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('expenses.noneForRiceField')}</p>
          ) : (
            <ul className="-mx-4 divide-y border-y">
              {expenses.data.map((expense) => (
                <ListRow
                  key={expense.id}
                  to={`/depenses/${expense.id}`}
                  title={expense.label}
                  subtitle={`${format.date(expense.date)} · ${t(EXPENSE_CATEGORY_KEY[expense.category])}`}
                  figure={format.amount(expense.amount)}
                />
              ))}
            </ul>
          ))}
        <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal">
          <Link to={addPath}>
            <Plus aria-hidden="true" />
            {t('expenses.addForRiceField')}
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}
