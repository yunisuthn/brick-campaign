import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote, NoCampaign } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useKilnBatches } from '../kiln-batches/useKilnBatches.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ExpenseForm, ExpenseFields } from './expenseFields.js';
import { type ExpenseCategory, useCreateExpense } from './useExpenses.js';

/** A new expense, in a sheet over the list (reference document, section 10.12). */
export function NewExpensePage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet
      title={t('expenses.newTitle')}
      description={
        campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
      }
      closeTo="/depenses"
    >
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="expenses.noCampaignSuffix" />
      )}
    </RouteSheet>
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
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={error && apiErrorMessage(error)} />
    );
  }
  if (!riceFields.isSuccess || !batches.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

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
      { onSuccess: () => void navigate('/depenses') },
    ),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <ExpenseFields
        register={form.register}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        batches={batches.data}
        riceFields={riceFields.data}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      <SheetActions submitLabel={t('common.save')} busy={create.isPending} />
    </form>
  );
}
