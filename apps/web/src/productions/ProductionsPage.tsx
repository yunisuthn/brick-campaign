import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { DateBox } from '../form/DateField.js';
import { formatBricks, formatDate } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type Production, type ProductionFilters, useProductions } from './useProductions.js';

export function ProductionsPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>
        {t('productions.title')}
        {campaign && t('common.campaignSuffix', { year: campaign.year })}
      </h1>
      {campaign && (
        <p>
          <Link to="/productions/nouvelle">{t('productions.newLink')}</Link>
        </p>
      )}
      {campaign ? (
        <ProductionList campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('productions.noCampaignSuffix')}
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
  const { t } = useTranslation();

  const failed = [productions, moulders, riceFields].find((query) => query.isError);
  const loaded = productions.isSuccess && moulders.isSuccess && riceFields.isSuccess;
  const filtered = Object.values(filters).some(Boolean);

  return (
    <>
      <FilterBar moulders={moulders.data ?? []} filters={filters} onChange={setFilters} />
      {failed && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {failed.error && apiErrorMessage(failed.error)}
        </p>
      )}
      {!failed && !loaded && <p role="status">{t('common.loading')}</p>}
      {loaded && productions.data.length === 0 && (
        <p>{t(filtered ? 'productions.noneForFilters' : 'productions.noneAtAll')}</p>
      )}
      {loaded && productions.data.length > 0 && (
        <>
          <p className="sub">
            {t('common.totalShown')}{' '}
            {formatBricks(productions.data.reduce((sum, p) => sum + p.quantity, 0))}
          </p>
          <Rows
            productions={productions.data}
            moulderName={new Map(moulders.data.map((m) => [m.id, m.name]))}
            fieldName={new Map(riceFields.data.map((f) => [f.id, f.name]))}
          />
        </>
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
          onChange={(event) => set({ moulderId: event.target.value || undefined })}
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

interface RowsProps {
  productions: ReadonlyArray<Production>;
  moulderName: ReadonlyMap<string, string>;
  fieldName: ReadonlyMap<string, string>;
}

function Rows({ productions, moulderName, fieldName }: RowsProps) {
  const { t } = useTranslation();
  return (
    <ul className="rows">
      {productions.map((production) => (
        <li key={production.id} className="row-split">
          <span>
            <Link to={`/productions/${production.id}`} className="row-name">
              {moulderName.get(production.moulderId) ?? t('common.unknownMoulder')}
            </Link>
            <span className="sub">
              {formatDate(production.startedOn)} ·{' '}
              {fieldName.get(production.riceFieldId) ?? t('productions.unknownRiceField')}
            </span>
          </span>
          <span className="figure">{formatBricks(production.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
