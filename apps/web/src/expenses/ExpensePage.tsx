import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type KilnBatch, useKilnBatches } from '../kiln-batches/useKilnBatches.js';
import { type RiceField, useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ExpenseForm, ExpenseFields } from './expenseFields.js';
import {
  type Expense,
  EXPENSE_CATEGORY_KEY,
  type ExpenseCategory,
  useCancelExpense,
  useExpense,
  useUpdateExpense,
} from './useExpenses.js';

export function ExpensePage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/depenses">{t('expenses.allExpenses')}</Link>
      </p>
      {campaign ? (
        <LoadedExpense campaignId={campaign.id} id={id} />
      ) : (
        <p>{t('common.noCampaignShort')}</p>
      )}
    </main>
  );
}

function LoadedExpense({ campaignId, id }: { campaignId: string; id: string }) {
  const expense = useExpense(campaignId, id);
  const riceFields = useRiceFields();
  const batches = useKilnBatches(campaignId);
  const { t } = useTranslation();

  if (expense.isError) {
    return <p role="alert">{loadErrorMessage(expense.error, t('expenses.notFound'))}</p>;
  }
  const failed = [riceFields, batches].find((query) => query.isError);
  if (failed)
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
      </p>
    );
  if (!expense.isSuccess || !riceFields.isSuccess || !batches.isSuccess) {
    return <p role="status">{t('common.loading')}</p>;
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
  const { t } = useTranslation();
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

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(
      {
        date: values.date,
        category: values.category as ExpenseCategory,
        amount: Number(digitsOnly(values.amount)),
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
        <span className="title-sub">
          {t(EXPENSE_CATEGORY_KEY[expense.category])} · {formatDate(expense.date)} ·{' '}
          {formatAmount(expense.amount)}
        </span>
      </h1>
      <form onSubmit={save} noValidate>
        <ExpenseFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          batches={batches}
          riceFields={riceFields}
        />
        {updateRefusal.message && (
          <p role="alert">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        {cancel.isError && (
          <p role="alert">
            {t('common.cancelFailedPrefix')} {apiErrorMessage(cancel.error)}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={busy || !form.formState.isDirty}>
            {t('common.save')}
          </button>
          {confirming ? (
            <>
              <button type="button" onClick={cancelExpense} disabled={busy}>
                {t('common.confirmCancellation')}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={busy}>
                {t('expenses.keepExpense')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} disabled={busy}>
              {t('expenses.cancelExpense')}
            </button>
          )}
        </p>
      </form>
    </>
  );
}
