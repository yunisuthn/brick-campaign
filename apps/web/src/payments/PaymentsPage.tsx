import { EllipsisVertical, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { SelectInput } from '@/components/fields';
import { FilterControl, FilterPanel } from '@/components/FilterPanel';
import { ListCard } from '@/components/ListCard';
import { Initials, ToneBadge } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContractorBalances } from '../balances/useBalances.js';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { PAYMENT_TYPE_KEY, PAYMENT_TYPE_TONE } from './paymentFields.js';
import { type Payment, type PaymentFilters, useCancelPayment, usePayments } from './usePayments.js';

/**
 * The payments of the current campaign. A new one and a correction open in a sheet over the
 * list, through the child routes in the outlet (reference document, section 10.12).
 */
export function PaymentsPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('payments.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <>
          <Button asChild>
            <Link to="/versements/nouveau">
              <Plus aria-hidden="true" />
              {t('payments.newLink')}
            </Link>
          </Button>
          <PaymentList campaignId={campaign.id} />
        </>
      ) : (
        <NoCampaign suffix="payments.noCampaignSuffix" />
      )}
      <Outlet />
    </Screen>
  );
}

function PaymentList({ campaignId }: { campaignId: string }) {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const payments = usePayments(campaignId, filters);
  const moulders = useMoulders(true);
  const contractors = useContractorBalances(campaignId);
  const { t } = useTranslation();
  const format = useFormat();

  const failed = [payments, moulders, contractors].find((query) => query.isError);
  const loaded = payments.isSuccess && moulders.isSuccess;
  const filtered = Object.values(filters).some(Boolean);
  const total =
    loaded && payments.data.length > 0
      ? format.amount(payments.data.reduce((sum, p) => sum + p.amount, 0))
      : null;

  return (
    <>
      <Filters
        moulders={moulders.data ?? []}
        contractorNames={(contractors.data ?? []).map((c) => c.contractorName)}
        filters={filters}
        onChange={setFilters}
        total={total}
      />
      {failed && (
        <ErrorNote
          prefix={t('common.loadFailedPrefix')}
          message={failed.error && apiErrorMessage(failed.error)}
        />
      )}
      {!failed && !loaded && <LoadingList />}
      {loaded && payments.data.length === 0 && (
        <EmptyState
          icon={Wallet}
          title={t(filtered ? 'payments.noneForFilters' : 'payments.noneAtAll')}
        />
      )}
      {loaded && payments.data.length > 0 && (
        <ListCard label={t('payments.title')}>
          {payments.data.map((payment) => (
            <PaymentRow
              key={payment.id}
              campaignId={campaignId}
              payment={payment}
              name={beneficiaryName(payment, new Map(moulders.data.map((m) => [m.id, m.name])), t)}
            />
          ))}
        </ListCard>
      )}
    </>
  );
}

/** A payment names a moulder or a contractor; the row says which one it went to. */
export function beneficiaryName(
  payment: Pick<Payment, 'moulderId' | 'contractorName'>,
  moulderName: ReadonlyMap<string, string>,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (payment.contractorName !== null) return payment.contractorName;
  if (payment.moulderId === null) return t('payments.unknownBeneficiary');
  return moulderName.get(payment.moulderId) ?? t('common.unknownMoulder');
}

/**
 * The whole row opens the correction; Éditer and Supprimer sit behind the menu at its end
 * (reference document, section 10.12). Deleting is a soft cancel done right here, behind the
 * red strip, since a versement stays in the history rather than disappearing outright
 * (section 5).
 */
function PaymentRow({
  campaignId,
  payment,
  name,
}: {
  campaignId: string;
  payment: Payment;
  name: string;
}) {
  const cancel = useCancelPayment(campaignId, payment.id);
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  const format = useFormat();
  const path = `/versements/${payment.id}`;

  return (
    <li>
      <div className="flex items-center gap-1 pr-1">
        <Link
          to={path}
          className="flex min-h-16 min-w-0 grow items-center gap-3 rounded-xl py-2.5 pl-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Initials name={name} />
          <span className="flex min-w-0 grow flex-col gap-1">
            <span className="font-semibold">{name}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
              {format.date(payment.date)}
              <ToneBadge tone={PAYMENT_TYPE_TONE[payment.type]}>
                {t(PAYMENT_TYPE_KEY[payment.type])}
              </ToneBadge>
            </span>
          </span>
          <span className="font-semibold whitespace-nowrap tabular-nums">
            {format.amount(payment.amount)}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              aria-label={`${t('common.actions')} · ${name}`}
            >
              <EllipsisVertical aria-hidden="true" className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem asChild className="min-h-11">
              <Link to={path}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11"
              onSelect={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {confirming && (
        <div className="px-4 pb-3">
          <ConfirmStrip
            confirmLabel={t('payments.row.confirmDelete')}
            keepLabel={t('common.keep')}
            onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })}
            onKeep={() => setConfirming(false)}
            busy={cancel.isPending}
          />
        </div>
      )}
      {cancel.isError && (
        <p role="alert" className="px-4 pb-3 text-sm text-destructive">
          {apiErrorMessage(cancel.error)}
        </p>
      )}
    </li>
  );
}

interface FiltersProps {
  moulders: ReadonlyArray<Moulder>;
  contractorNames: ReadonlyArray<string>;
  filters: PaymentFilters;
  onChange: (filters: PaymentFilters) => void;
  total: string | null;
}

/** A beneficiary is filtered either as a moulder or as a contractor name, never both. */
function Filters({ moulders, contractorNames, filters, onChange, total }: FiltersProps) {
  const set = (patch: PaymentFilters) => onChange({ ...filters, ...patch });
  const { t } = useTranslation();
  return (
    <FilterPanel active={Object.values(filters).some(Boolean)} total={total}>
      <FilterControl label={t('common.moulderLabel')}>
        {(id) => (
          <SelectInput
            id={id}
            value={filters.moulderId ?? ''}
            onChange={(moulderId) =>
              set({ moulderId: moulderId || undefined, contractorName: undefined })
            }
            options={[
              { value: '', label: t('common.all') },
              ...moulders.map((m) => ({
                value: m.id,
                label: `${m.name}${!m.active ? t('common.retiredSuffix') : ''}`,
              })),
            ]}
          />
        )}
      </FilterControl>
      <FilterControl label={t('payments.contractorLabel')}>
        {(id) => (
          <SelectInput
            id={id}
            value={filters.contractorName ?? ''}
            onChange={(contractorName) =>
              set({ contractorName: contractorName || undefined, moulderId: undefined })
            }
            options={[
              { value: '', label: t('common.all') },
              ...contractorNames.map((name) => ({ value: name, label: name })),
            ]}
          />
        )}
      </FilterControl>
    </FilterPanel>
  );
}
