import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import { type KilnBatch, useKilnBatches } from '../kiln-batches/useKilnBatches.js';
import { type RiceField, useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ExpenseForm, ExpenseFields } from './expenseFields.js';
import {
  type Expense,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  useCancelExpense,
  useExpense,
  useUpdateExpense,
} from './useExpenses.js';

export function ExpensePage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/depenses">Toutes les dépenses</Link>
      </p>
      {campaign ? <LoadedExpense campaignId={campaign.id} id={id} /> : <p>Aucune campagne.</p>}
    </main>
  );
}

function LoadedExpense({ campaignId, id }: { campaignId: string; id: string }) {
  const expense = useExpense(campaignId, id);
  const riceFields = useRiceFields();
  const batches = useKilnBatches(campaignId);

  if (expense.isError) {
    return <p role="alert">{loadErrorMessage(expense.error, 'Dépense introuvable.')}</p>;
  }
  const failed = [riceFields, batches].find((query) => query.isError);
  if (failed) return <p role="alert">Chargement impossible : {failed.error?.message}</p>;
  if (!expense.isSuccess || !riceFields.isSuccess || !batches.isSuccess) {
    return <p role="status">Chargement…</p>;
  }

  return (
    <CorrectionForm
      key={expense.data.id}
      expense={expense.data}
      riceFields={riceFields.data}
      batches={batches.data}
    />
  );
}

interface CorrectionFormProps {
  expense: Expense;
  riceFields: ReadonlyArray<RiceField>;
  batches: ReadonlyArray<KilnBatch>;
}

/** Cancelling asks for a second click; the row stays in the database (section 5). */
function CorrectionForm({ expense, riceFields, batches }: CorrectionFormProps) {
  const update = useUpdateExpense(expense.campaignId, expense.id);
  const cancel = useCancelExpense(expense.campaignId, expense.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ExpenseForm>({
    defaultValues: {
      date: expense.date,
      category: expense.category,
      amount: String(expense.amount),
      label: expense.label,
      riceFieldId: expense.riceFieldId ?? '',
      kilnBatchId: expense.kilnBatchId ?? '',
    },
  });

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        date: values.date,
        category: values.category as ExpenseCategory,
        amount: Number(values.amount),
        label: values.label,
        riceFieldId: values.riceFieldId === '' ? null : values.riceFieldId,
        kilnBatchId: values.kilnBatchId === '' ? null : values.kilnBatchId,
      },
      { onSuccess: (saved) => form.reset({ ...values, amount: String(saved.amount) }) },
    ),
  );
  const cancelExpense = () => cancel.mutate(undefined, { onSuccess: () => navigate('/depenses') });
  const busy = update.isPending || cancel.isPending;

  return (
    <>
      <h1>
        {expense.label}
        <span style={{ display: 'block', fontSize: '1rem', fontWeight: 'normal' }}>
          {EXPENSE_CATEGORY_LABELS[expense.category]} · {formatDate(expense.date)} ·{' '}
          {formatAmount(expense.amount)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <ExpenseFields
          register={form.register}
          errors={form.formState.errors}
          batches={batches}
          riceFields={riceFields}
        />
        {update.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Enregistrement impossible : {apiErrorMessage(update.error)}
          </p>
        )}
        {cancel.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Annulation impossible : {apiErrorMessage(cancel.error)}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            Enregistrer
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelExpense} disabled={busy}>
                Confirmer l’annulation
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                Garder la dépense
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              Annuler la dépense
            </button>
          )}
        </p>
      </form>
    </>
  );
}
