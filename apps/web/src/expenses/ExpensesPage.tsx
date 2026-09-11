import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import {
  type Expense,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  expenseCategories,
  useExpenses,
} from './useExpenses.js';

export function ExpensesPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Dépenses{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign && (
        <p>
          <Link to="/depenses/nouvelle">Saisir une dépense</Link>
        </p>
      )}
      {campaign ? (
        <ExpenseList campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          une dépense.
        </p>
      )}
    </main>
  );
}

function ExpenseList({ campaignId }: { campaignId: string }) {
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const expenses = useExpenses(campaignId, category === '' ? {} : { category });

  return (
    <>
      <p>
        <label>
          Catégorie
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory | '')}
          >
            <option value="">Toutes</option>
            {expenseCategories.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </p>
      {expenses.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(expenses.error)}</p>
      )}
      {expenses.isPending && <p role="status">Chargement…</p>}
      {expenses.isSuccess &&
        (expenses.data.length === 0 ? (
          <p>
            {category === '' ? 'Aucune dépense saisie.' : 'Aucune dépense dans cette catégorie.'}
          </p>
        ) : (
          <>
            <p>
              Total : <strong>{formatAmount(total(expenses.data))}</strong>
            </p>
            <ul className="rows">
              {expenses.data.map((expense) => (
                <li key={expense.id} className="row-split">
                  <span>
                    <Link to={`/depenses/${expense.id}`} className="row-name">
                      {expense.label}
                    </Link>
                    <span className="sub">
                      {formatDate(expense.date)} · {EXPENSE_CATEGORY_LABELS[expense.category]}
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
