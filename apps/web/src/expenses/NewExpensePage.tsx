import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useKilnBatches } from '../kiln-batches/useKilnBatches.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type ExpenseForm, ExpenseFields } from './expenseFields.js';
import { type ExpenseCategory, useCreateExpense } from './useExpenses.js';

export function NewExpensePage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/depenses">Toutes les dépenses</Link>
      </p>
      <h1>Nouvelle dépense</h1>
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          une dépense.
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
    return <p role="alert">Chargement impossible : {error && apiErrorMessage(error)}</p>;
  }
  if (!riceFields.isSuccess || !batches.isSuccess) return <p role="status">Chargement…</p>;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(
      {
        date: values.date,
        category: values.category as ExpenseCategory,
        amount: Number(values.amount),
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
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        batches={batches.data}
        riceFields={riceFields.data}
      />
      {createRefusal.message && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {createRefusal.message}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer
        </button>
      </p>
    </form>
  );
}
