import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import { EXPENSE_CATEGORY_LABELS, useExpenses } from './useExpenses.js';

/**
 * What a rice field costs on the current campaign, summed from the expenses attached to it.
 * The cost is not a field of the rice field (reference document, section 3): a rice field is
 * reference data shared between campaigns, while a contract is paid season by season, so the
 * amount lives where it can differ from one year to the next.
 */
export function RiceFieldExpenses({ riceFieldId }: { riceFieldId: string }) {
  const { campaign } = useCurrentCampaign();

  return (
    <section aria-labelledby="rice-field-cost">
      <h2 id="rice-field-cost">Coût sur la campagne{campaign && ` ${campaign.year}`}</h2>
      {campaign ? (
        <Linked campaignId={campaign.id} riceFieldId={riceFieldId} />
      ) : (
        <p>Aucune campagne.</p>
      )}
    </section>
  );
}

function Linked({ campaignId, riceFieldId }: { campaignId: string; riceFieldId: string }) {
  const expenses = useExpenses(campaignId, { riceFieldId });
  const addPath = `/depenses/nouvelle?category=rice_field&riceFieldId=${riceFieldId}`;

  if (expenses.isError)
    return <p role="alert">Chargement impossible : {apiErrorMessage(expenses.error)}</p>;
  if (!expenses.isSuccess) return <p role="status">Chargement…</p>;

  const total = expenses.data.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      <p>
        Total : <strong>{formatAmount(total)}</strong>
      </p>
      {expenses.data.length === 0 ? (
        <p>Aucune dépense rattachée à cette rizière.</p>
      ) : (
        <ul className="rows">
          {expenses.data.map((expense) => (
            <li key={expense.id}>
              <Link to={`/depenses/${expense.id}`}>{expense.label}</Link>
              <span className="sub">
                {formatDate(expense.date)} · {EXPENSE_CATEGORY_LABELS[expense.category]} ·{' '}
                {formatAmount(expense.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to={addPath}>Saisir une dépense pour cette rizière</Link>
      </p>
    </>
  );
}
