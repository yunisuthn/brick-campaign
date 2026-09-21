import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useKilnBatches } from '../kiln-batches/useKilnBatches.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ExpenseForm, ExpenseFields } from './expenseFields.js';
import { type ExpenseCategory, useCreateExpense } from './useExpenses.js';

export function NewExpensePage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/depenses">{t('expenses.allExpenses')}</Link>
      </p>
      <h1>{t('expenses.newTitle')}</h1>
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
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

/**
 * A rice field or a batch may come from the URL, so a screen showing one can send here with
 * the link already made; both stay changeable.
 */
function EntryForm({ campaignId }: { campaignId: string }) {
  const [params] = useSearchParams();
  const riceFields = useRiceFields();
  const batches = useKilnBatches(campaignId);
  const create = useCreateExpense(campaignId);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<ExpenseForm>({
    defaultValues: {
      date: today(),
      category: (params.get('category') as ExpenseCategory | null) ?? 'other',
      amount: '',
      label: '',
      riceFieldId: params.get('riceFieldId') ?? '',
      kilnBatchId: params.get('kilnBatchId') ?? '',
    },
  });

  if (riceFields.isError || batches.isError) {
    const error = riceFields.error ?? batches.error;
    return (
      <p role="alert">
        {t('common.loadFailedPrefix')} {error && apiErrorMessage(error)}
      </p>
    );
  }
  if (!riceFields.isSuccess || !batches.isSuccess)
    return <p role="status">{t('common.loading')}</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        date: values.date,
        category: values.category as ExpenseCategory,
        amount: Number(digitsOnly(values.amount)),
        label: values.label,
        riceFieldId: values.riceFieldId === '' ? null : values.riceFieldId,
        kilnBatchId: values.kilnBatchId === '' ? null : values.kilnBatchId,
      },
      { onSuccess: () => navigate('/depenses') },
    ),
  );

  return (
    <form onSubmit={submit} noValidate>
      <ExpenseFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        batches={batches.data}
        riceFields={riceFields.data}
      />
      {createRefusal.message && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('common.save')}
        </button>
      </p>
    </form>
  );
}
