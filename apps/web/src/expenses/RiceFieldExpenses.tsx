import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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

  return (
    <section aria-labelledby="rice-field-cost">
      <h2 id="rice-field-cost">
        {t('expenses.costOnCampaign')}
        {campaign &&
          ` ${campaign.year}${t('campaigns.trancheSuffix', { tranche: campaign.tranche })}`}
      </h2>
      {campaign ? (
        <Linked campaignId={campaign.id} riceFieldId={riceFieldId} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </section>
  );
}

function Linked({ campaignId, riceFieldId }: { campaignId: string; riceFieldId: string }) {
  const expenses = useExpenses(campaignId, { riceFieldId });
  const addPath = `/depenses/nouvelle?category=rice_field&riceFieldId=${riceFieldId}`;
  const { t } = useTranslation();

  if (expenses.isError)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {apiErrorMessage(expenses.error)}
      </p>
    );
  if (!expenses.isSuccess) return <p role="status">{t('common.loading')}</p>;

  const total = expenses.data.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      <p>
        {t('expenses.totalLabel')} <strong>{formatAmount(total)}</strong>
      </p>
      {expenses.data.length === 0 ? (
        <p>{t('expenses.noneForRiceField')}</p>
      ) : (
        <ul className="rows">
          {expenses.data.map((expense) => (
            <li key={expense.id}>
              <Link to={`/depenses/${expense.id}`}>{expense.label}</Link>
              <span className="sub">
                {formatDate(expense.date)} · {t(EXPENSE_CATEGORY_KEY[expense.category])} ·{' '}
                {formatAmount(expense.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to={addPath}>{t('expenses.addForRiceField')}</Link>
      </p>
    </>
  );
}
