import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { RouteSheet } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
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

/** An expense's correction, in a sheet over the list (reference document, section 10.12). */
export function ExpensePage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  if (!campaign) {
    return (
      <RouteSheet title={t('expenses.title')} closeTo="/depenses">
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      </RouteSheet>
    );
  }
  return <LoadedExpense campaignId={campaign.id} id={id} />;
}

function LoadedExpense({ campaignId, id }: { campaignId: string; id: string }) {
  const expense = useExpense(campaignId, id);
  const riceFields = useRiceFields();
  const batches = useKilnBatches(campaignId);
  const { t } = useTranslation();

  const failed = [riceFields, batches].find((query) => query.isError);
  if (!expense.isSuccess || !riceFields.isSuccess || !batches.isSuccess) {
    return (
      <RouteSheet title={t('expenses.title')} closeTo="/depenses">
        {expense.isError ? (
          <ErrorNote message={loadErrorMessage(expense.error, t('expenses.notFound'))} />
        ) : failed ? (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={failed.error && apiErrorMessage(failed.error)}
          />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </RouteSheet>
    );
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

/** Cancelling asks for a second step; the row stays in the database (section 5). */
function CorrectionForm({ expense, riceFields, batches }: CorrectionFormProps) {
  const update = useUpdateExpense(expense.campaignId, expense.id);
  const cancel = useCancelExpense(expense.campaignId, expense.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
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
  const cancelExpense = () =>
    cancel.mutate(undefined, { onSuccess: () => void navigate('/depenses') });
  const busy = update.isPending || cancel.isPending;

  return (
    <RouteSheet
      title={expense.label}
      description={`${t(EXPENSE_CATEGORY_KEY[expense.category])} · ${format.date(expense.date)} · ${format.amount(expense.amount)}`}
      closeTo="/depenses"
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <ExpenseFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          batches={batches}
          riceFields={riceFields}
        />
        {updateRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        {cancel.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('common.cancelFailedPrefix')} {apiErrorMessage(cancel.error)}
          </p>
        )}
        <Button type="submit" disabled={busy || !form.formState.isDirty}>
          {t('common.save')}
        </Button>
        {confirming ? (
          <ConfirmStrip
            confirmLabel={t('common.confirmCancellation')}
            keepLabel={t('expenses.keepExpense')}
            onConfirm={cancelExpense}
            onKeep={() => setConfirming(false)}
            busy={busy}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            {t('expenses.cancelExpense')}
          </Button>
        )}
      </form>
    </RouteSheet>
  );
}
