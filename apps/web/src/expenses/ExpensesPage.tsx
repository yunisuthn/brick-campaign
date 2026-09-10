import { useState } from 'react';
import { Link } from 'react-router';
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
    <main style={{ padding: '1rem' }}>
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
            style={{ display: 'block' }}
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
      {expenses.isError && <p role="alert">Chargement impossible : {expenses.error.message}</p>}
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
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {expenses.data.map((expense) => (
                <li
                  key={expense.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    background: 'white',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span>
                    <Link to={`/depenses/${expense.id}`} style={{ fontWeight: 'bold' }}>
                      {expense.label}
                    </Link>
                    <span style={{ display: 'block', fontSize: '0.875rem' }}>
                      {formatDate(expense.date)} · {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>{formatAmount(expense.amount)}</span>
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
