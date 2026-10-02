import { Plus, Receipt } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ListCard, ListRow } from '@/components/ListCard';
import { FigureTile } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import {
  type Expense,
  EXPENSE_CATEGORY_KEY,
  type ExpenseCategory,
  expenseCategories,
  useExpenses,
} from './useExpenses.js';

/**
 * The expenses of the current campaign, one category at a time or all of them. A new one and a
 * correction open in a sheet over the list (reference document, section 10.12).
 */
export function ExpensesPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('expenses.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <>
          <Button asChild>
            <Link to="/depenses/nouvelle">
              <Plus aria-hidden="true" />
              {t('expenses.newLink')}
            </Link>
          </Button>
          <ExpenseList campaignId={campaign.id} />
        </>
      ) : (
        <NoCampaign suffix="expenses.noCampaignSuffix" />
      )}
      <Outlet />
    </Screen>
  );
}

function ExpenseList({ campaignId }: { campaignId: string }) {
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const expenses = useExpenses(campaignId, category === '' ? {} : { category });
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <>
      <CategoryChips value={category} onChange={setCategory} />
      {expenses.isError && (
        <ErrorNote
          prefix={t('common.loadFailedPrefix')}
          message={apiErrorMessage(expenses.error)}
        />
      )}
      {expenses.isPending && <LoadingList />}
      {expenses.isSuccess &&
        (expenses.data.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t(category === '' ? 'expenses.noneAtAll' : 'expenses.noneForCategory')}
          />
        ) : (
          <>
            <FigureTile label={t('dashboard.total')}>
              {format.amount(total(expenses.data))}
            </FigureTile>
            <ListCard label={t('expenses.title')}>
              {expenses.data.map((expense) => (
                <ListRow
                  key={expense.id}
                  to={`/depenses/${expense.id}`}
                  title={expense.label}
                  subtitle={`${format.date(expense.date)} · ${t(EXPENSE_CATEGORY_KEY[expense.category])}`}
                  figure={format.amount(expense.amount)}
                />
              ))}
            </ListCard>
          </>
        ))}
    </>
  );
}

/** One category or all, a tap each, in a row that scrolls sideways on a narrow screen. */
function CategoryChips({
  value,
  onChange,
}: {
  value: ExpenseCategory | '';
  onChange: (category: ExpenseCategory | '') => void;
}) {
  const { t } = useTranslation();
  const chips: Array<{ value: ExpenseCategory | ''; label: string }> = [
    { value: '', label: t('expenses.allCategories') },
    ...expenseCategories.map((category) => ({
      value: category,
      label: t(EXPENSE_CATEGORY_KEY[category]),
    })),
  ];
  return (
    <RadioGroupPrimitive.Root
      value={value === '' ? 'all' : value}
      onValueChange={(next) => onChange(next === 'all' ? '' : (next as ExpenseCategory))}
      aria-label={t('expenses.categoryLabel')}
      orientation="horizontal"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {chips.map((chip) => (
        <RadioGroupPrimitive.Item
          key={chip.value || 'all'}
          value={chip.value || 'all'}
          className={cn(
            'min-h-10 shrink-0 rounded-full border bg-card px-3.5 text-sm font-medium transition-colors outline-none',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background',
          )}
        >
          {chip.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/** The sum of what is shown, filter included: the dashboard keeps the campaign-wide figures. */
function total(expenses: ReadonlyArray<Expense>): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}
