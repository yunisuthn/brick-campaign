import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { DateBox } from '../form/DateField.js';
import { formatAmount, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { PAYMENT_TYPE_KEY } from './paymentFields.js';
import { type Payment, type PaymentFilters, useCancelPayment, usePayments } from './usePayments.js';

export function PaymentsPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('payments.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year })}
      </h1>
      {campaign && (
        <p>
          <Link to="/versements/nouveau">{t('payments.newLink')}</Link>
        </p>
      )}
      {campaign ? (
        <PaymentList campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('payments.noCampaignSuffix')}
        </p>
      )}
    </main>
  );
}

function PaymentList({ campaignId }: { campaignId: string }) {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const payments = usePayments(campaignId, filters);
  const moulders = useMoulders(true);

  const failed = [payments, moulders].find((query) => query.isError);
  const loaded = payments.isSuccess && moulders.isSuccess;
  const filtered = Object.values(filters).some(Boolean);

  const { t } = useTranslation();

  return (
    <>
      <details className="filters-toggle" open={filtered}>
        <summary>{t('common.filters')}</summary>
        <FilterBar moulders={moulders.data ?? []} filters={filters} onChange={setFilters} />
      </details>
      {failed && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
        </p>
      )}
      {!failed && !loaded && <p role="status">{t('common.loading')}</p>}
      {loaded && payments.data.length === 0 && (
        <p>{t(filtered ? 'payments.noneForFilters' : 'payments.noneAtAll')}</p>
      )}
      {loaded && payments.data.length > 0 && (
        <>
          <p className="sub">
            {t('common.totalShown')}{' '}
            {formatAmount(payments.data.reduce((sum, p) => sum + p.amount, 0))}
          </p>
          <Rows
            campaignId={campaignId}
            payments={payments.data}
            moulderName={new Map(moulders.data.map((m) => [m.id, m.name]))}
          />
        </>
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

function Rows({
  campaignId,
  payments,
  moulderName,
}: {
  campaignId: string;
  payments: ReadonlyArray<Payment>;
  moulderName: ReadonlyMap<string, string>;
}) {
  return (
    <ul className="rows">
      {payments.map((payment) => (
        <PaymentRow
          key={payment.id}
          campaignId={campaignId}
          payment={payment}
          moulderName={moulderName}
        />
      ))}
    </ul>
  );
}

/**
 * Editing opens the full correction form; deleting is a soft cancel done right here, behind a
 * second click, since a versement stays in the history rather than disappearing outright
 * (reference document, section 5).
 */
function PaymentRow({
  campaignId,
  payment,
  moulderName,
}: {
  campaignId: string;
  payment: Payment;
  moulderName: ReadonlyMap<string, string>;
}) {
  const cancel = useCancelPayment(campaignId, payment.id);
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();

  return (
    <li>
      <div className="row-split">
        <span>
          <Link to={`/versements/${payment.id}`} className="row-name">
            {beneficiaryName(payment, moulderName, t)}
          </Link>
          <span className="sub">
            {formatDate(payment.date)} · {t(PAYMENT_TYPE_KEY[payment.type])} ·{' '}
            {confirming ? (
              <>
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })
                  }
                  disabled={cancel.isPending}
                >
                  {t('payments.row.confirmDelete')}
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setConfirming(false)}
                  disabled={cancel.isPending}
                >
                  {t('common.keep')}
                </button>
              </>
            ) : (
              <>
                <Link to={`/versements/${payment.id}`}>{t('common.edit')}</Link> ·{' '}
                <button type="button" className="link-button" onClick={() => setConfirming(true)}>
                  {t('common.delete')}
                </button>
              </>
            )}
          </span>
        </span>
        <span className="figure">{formatAmount(payment.amount)}</span>
      </div>
      {cancel.isError && <p role="alert">{apiErrorMessage(cancel.error)}</p>}
    </li>
  );
}

interface FilterBarProps {
  moulders: ReadonlyArray<Moulder>;
  filters: PaymentFilters;
  onChange: (filters: PaymentFilters) => void;
}

/** A beneficiary is filtered either as a moulder or as a contractor name, never both. */
function FilterBar({ moulders, filters, onChange }: FilterBarProps) {
  const set = (patch: PaymentFilters) => onChange({ ...filters, ...patch });
  const { t } = useTranslation();
  return (
    <form
      aria-label={t('common.filters')}
      onSubmit={(event) => event.preventDefault()}
      className="filters"
    >
      <label>
        {t('common.moulderLabel')}
        <select
          value={filters.moulderId ?? ''}
          onChange={(event) =>
            set({ moulderId: event.target.value || undefined, contractorName: undefined })
          }
        >
          <option value="">{t('common.all')}</option>
          {moulders.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {!m.active && t('common.retiredSuffix')}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('payments.contractorLabel')}
        <input
          type="search"
          value={filters.contractorName ?? ''}
          onChange={(event) =>
            set({ contractorName: event.target.value || undefined, moulderId: undefined })
          }
        />
      </label>
      <DateBox
        label={t('common.from')}
        value={filters.from ?? ''}
        onChange={(iso) => set({ from: iso || undefined })}
      />
      <DateBox
        label={t('common.to')}
        value={filters.to ?? ''}
        onChange={(iso) => set({ to: iso || undefined })}
      />
    </form>
  );
}
