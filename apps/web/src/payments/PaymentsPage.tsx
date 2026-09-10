import { type CSSProperties, useState } from 'react';
import { Link } from 'react-router';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, formatDate } from '../format.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import {
  type Payment,
  PAYMENT_TYPE_LABELS,
  type PaymentFilters,
  usePayments,
} from './usePayments.js';

export function PaymentsPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Versements{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign && (
        <p>
          <Link to="/versements/nouveau">Saisir un versement</Link>
        </p>
      )}
      {campaign ? (
        <PaymentList campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          un versement.
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

  return (
    <>
      <FilterBar moulders={moulders.data ?? []} filters={filters} onChange={setFilters} />
      {failed && <p role="alert">Chargement impossible : {failed.error?.message}</p>}
      {!failed && !loaded && <p role="status">Chargement…</p>}
      {loaded && payments.data.length === 0 && (
        <p>{filtered ? 'Aucun versement pour ces critères.' : 'Aucun versement saisi.'}</p>
      )}
      {loaded && payments.data.length > 0 && (
        <Rows
          payments={payments.data}
          moulderName={new Map(moulders.data.map((m) => [m.id, m.name]))}
        />
      )}
    </>
  );
}

/** A payment names a moulder or a contractor; the row says which one it went to. */
export function beneficiaryName(
  payment: Pick<Payment, 'moulderId' | 'contractorName'>,
  moulderName: ReadonlyMap<string, string>,
): string {
  if (payment.contractorName !== null) return payment.contractorName;
  if (payment.moulderId === null) return 'Bénéficiaire inconnu';
  return moulderName.get(payment.moulderId) ?? 'Mouleur inconnu';
}

function Rows({
  payments,
  moulderName,
}: {
  payments: ReadonlyArray<Payment>;
  moulderName: ReadonlyMap<string, string>;
}) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {payments.map((payment) => (
        <li
          key={payment.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 1rem',
            marginBottom: '0.5rem',
            background: 'white',
            borderRadius: '0.5rem',
          }}
        >
          <span>
            <Link to={`/versements/${payment.id}`} style={{ fontWeight: 'bold' }}>
              {beneficiaryName(payment, moulderName)}
            </Link>
            <span style={{ display: 'block', fontSize: '0.875rem' }}>
              {formatDate(payment.date)} · {PAYMENT_TYPE_LABELS[payment.type]}
            </span>
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{formatAmount(payment.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

interface FilterBarProps {
  moulders: ReadonlyArray<Moulder>;
  filters: PaymentFilters;
  onChange: (filters: PaymentFilters) => void;
}

const filterControl: CSSProperties = { display: 'block' };

/** A beneficiary is filtered either as a moulder or as a contractor name, never both. */
function FilterBar({ moulders, filters, onChange }: FilterBarProps) {
  const set = (patch: PaymentFilters) => onChange({ ...filters, ...patch });
  return (
    <form
      aria-label="Filtres"
      onSubmit={(event) => event.preventDefault()}
      style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}
    >
      <label>
        Mouleur
        <select
          style={filterControl}
          value={filters.moulderId ?? ''}
          onChange={(event) =>
            set({ moulderId: event.target.value || undefined, contractorName: undefined })
          }
        >
          <option value="">Tous</option>
          {moulders.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {!m.active && ' (retiré)'}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prestataire
        <input
          type="search"
          style={filterControl}
          value={filters.contractorName ?? ''}
          onChange={(event) =>
            set({ contractorName: event.target.value || undefined, moulderId: undefined })
          }
        />
      </label>
      <label>
        Du
        <input
          type="date"
          style={filterControl}
          value={filters.from ?? ''}
          onChange={(event) => set({ from: event.target.value || undefined })}
        />
      </label>
      <label>
        Au
        <input
          type="date"
          style={filterControl}
          value={filters.to ?? ''}
          onChange={(event) => set({ to: event.target.value || undefined })}
        />
      </label>
    </form>
  );
}
