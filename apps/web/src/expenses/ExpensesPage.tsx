import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { Select } from '../form/Select.js';
import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import {
  type Expense,
  EXPENSE_CATEGORY_KEY,
  type ExpenseCategory,
  expenseCategories,
  useExpenses,
} from './useExpenses.js';

export function ExpensesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('expenses.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year, tranche: campaign.tranche })}
      </h1>
      {campaign && (
        <p>
          <Link to="/depenses/nouvelle">{t('expenses.newLink')}</Link>
        </p>
      )}
      {campaign ? (
        <ExpenseList campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('expenses.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function ExpenseList({ campaignId }: { campaignId: string }) {
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const expenses = useExpenses(campaignId, category === '' ? {} : { category });
  const { t } = useTranslation();

  return (
    <>
      <p>
        <Select
          label={t('expenses.categoryLabel')}
          value={category}
          onChange={(value) => setCategory(value as ExpenseCategory | '')}
          options={[
            { value: '', label: t('expenses.allCategories') },
            ...expenseCategories.map((value) => ({ value, label: t(EXPENSE_CATEGORY_KEY[value]) })),
          ]}
        />
      </p>
      {expenses.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(expenses.error)}
        </p>
      )}
      {expenses.isPending && <p role="status">{t('common.loading')}</p>}
      {expenses.isSuccess &&
        (expenses.data.length === 0 ? (
          <p>{t(category === '' ? 'expenses.noneAtAll' : 'expenses.noneForCategory')}</p>
        ) : (
          <>
            <p>
              {t('expenses.totalLabel')} <strong>{formatAmount(total(expenses.data))}</strong>
            </p>
            <ul className="rows">
              {expenses.data.map((expense) => (
                <li key={expense.id} className="row-split">
                  <span>
                    <Link to={`/depenses/${expense.id}`} className="row-name">
                      {expense.label}
                    </Link>
                    <span className="sub">
                      {formatDate(expense.date)} · {t(EXPENSE_CATEGORY_KEY[expense.category])}
                    </span>
                  </span>
                  <span className="figure">{formatAmount(expense.amount)}</span>
                </li>
              ))}
            </ul>
          </>
        ))}
    </>
  );
}

/** The sum of what is shown, filter included: the dashboard keeps the campaign-wide figures. */
function total(expenses: ReadonlyArray<Expense>): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}
