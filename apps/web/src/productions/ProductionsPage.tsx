import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatBricks, formatDate } from '../format.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type Production, type ProductionFilters, useProductions } from './useProductions.js';

export function ProductionsPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main className="page-wide">
      <h1>Productions{campaign && ` · Campagne ${campaign.year}`}</h1>
      {campaign && (
        <p>
          <Link to="/productions/nouvelle">Saisir une production</Link>
        </p>
      )}
      {campaign ? (
        <ProductionList campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          une production.
        </p>
      )}
    </main>
  );
}

/**
 * The API gives ids; the names come from the reference lists, retired moulders included since
 * an old entry can name a moulder who has left since. The filters are the API's own.
 */
function ProductionList({ campaignId }: { campaignId: string }) {
  const [filters, setFilters] = useState<ProductionFilters>({});
  const productions = useProductions(campaignId, filters);
  const moulders = useMoulders(true);
  const riceFields = useRiceFields();

  const failed = [productions, moulders, riceFields].find((query) => query.isError);
  const loaded = productions.isSuccess && moulders.isSuccess && riceFields.isSuccess;
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <FilterBar moulders={moulders.data ?? []} filters={filters} onChange={setFilters} />
      {failed && (
        <p role="alert">Chargement impossible : {failed.error && apiErrorMessage(failed.error)}</p>
      )}
      {!failed && !loaded && <p role="status">Chargement…</p>}
      {loaded && productions.data.length === 0 && (
        <p>{filtered ? 'Aucune production pour ces critères.' : 'Aucune production saisie.'}</p>
      )}
      {loaded && productions.data.length > 0 && (
        <Rows
          productions={productions.data}
          moulderName={new Map(moulders.data.map((m) => [m.id, m.name]))}
          fieldName={new Map(riceFields.data.map((f) => [f.id, f.name]))}
        />
      )}
    </>
  );
}

interface FilterBarProps {
  moulders: ReadonlyArray<Moulder>;
  filters: ProductionFilters;
  onChange: (filters: ProductionFilters) => void;
}

/** A moulder, a period, or both; an empty control means no filter on that side. */
function FilterBar({ moulders, filters, onChange }: FilterBarProps) {
  const set = (patch: ProductionFilters) => onChange({ ...filters, ...patch });
  return (
    <form aria-label="Filtres" onSubmit={(event) => event.preventDefault()} className="filters">
      <label>
        Mouleur
        <select
          value={filters.moulderId ?? ''}
          onChange={(event) => set({ moulderId: event.target.value || undefined })}
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
        Du
        <input
          type="date"
          value={filters.from ?? ''}
          onChange={(event) => set({ from: event.target.value || undefined })}
        />
      </label>
      <label>
        Au
        <input
          type="date"
          value={filters.to ?? ''}
          onChange={(event) => set({ to: event.target.value || undefined })}
        />
      </label>
    </form>
  );
}

interface RowsProps {
  productions: ReadonlyArray<Production>;
  moulderName: ReadonlyMap<string, string>;
  fieldName: ReadonlyMap<string, string>;
}

function Rows({ productions, moulderName, fieldName }: RowsProps) {
  return (
    <ul className="rows">
      {productions.map((production) => (
        <li key={production.id} className="row-split">
          <span>
            <Link to={`/productions/${production.id}`} className="row-name">
              {moulderName.get(production.moulderId) ?? 'Mouleur inconnu'}
            </Link>
            <span className="sub">
              {formatDate(production.date)} ·{' '}
              {fieldName.get(production.riceFieldId) ?? 'Rizière inconnue'}
            </span>
          </span>
          <span className="figure">{formatBricks(production.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
