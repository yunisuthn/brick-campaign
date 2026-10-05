import { BrickWall, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { DateInput, SelectInput } from '@/components/fields';
import { FilterControl, FilterPanel } from '@/components/FilterPanel';
import { ListCard, ListRow } from '@/components/ListCard';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList, NoCampaign } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import { useRiceFields } from '../rice-fields/useRiceFields.js';
import { type Production, type ProductionFilters, useProductions } from './useProductions.js';

/**
 * The entries of the current campaign, a card per day. A new entry and a correction open in a
 * sheet over this list, through the child routes rendered in the outlet (section 10.12).
 */
export function ProductionsPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader
        title={t('productions.title')}
        subtitle={
          campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
        }
      />
      {campaign ? (
        <>
          <Button asChild className="sm:self-start">
            <Link to="/productions/nouvelle">
              <Plus aria-hidden="true" />
              {t('productions.newLink')}
            </Link>
          </Button>
          <ProductionList campaignId={campaign.id} />
        </>
      ) : (
        <NoCampaign suffix="productions.noCampaignSuffix" />
      )}
      <Outlet />
    </Screen>
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
  const format = useFormat();

  const failed = [productions, moulders, riceFields].find((query) => query.isError);
  const loaded = productions.isSuccess && moulders.isSuccess && riceFields.isSuccess;
  const filtered = Object.values(filters).some(Boolean);
  const total = loaded ? productions.data.reduce((sum, p) => sum + p.quantity, 0) : 0;

  return (
    <>
      <Filters
        moulders={moulders.data ?? []}
        filters={filters}
        onChange={setFilters}
        total={loaded && productions.data.length > 0 ? format.bricks(total) : null}
      />
      {failed && (
        <ErrorNote
          prefix={t('common.loadFailedPrefix')}
          message={failed.error && apiErrorMessage(failed.error)}
        />
      )}
      {!failed && !loaded && <LoadingList />}
      {loaded && productions.data.length === 0 && (
        <EmptyState
          icon={BrickWall}
          title={t(filtered ? 'productions.noneForFilters' : 'productions.noneAtAll')}
        />
      )}
      {loaded &&
        byDay(productions.data).map(([day, entries]) => (
          <ListCard
            key={day}
            title={format.day(day)}
            aside={format.bricks(entries.reduce((sum, p) => sum + p.quantity, 0))}
          >
            {entries.map((production) => (
              <ListRow
                key={production.id}
                to={`/productions/${production.id}`}
                title={
                  moulders.data.find((m) => m.id === production.moulderId)?.name ??
                  t('common.unknownMoulder')
                }
                subtitle={
                  riceFields.data.find((f) => f.id === production.riceFieldId)?.name ??
                  t('productions.unknownRiceField')
                }
                figure={format.bricks(production.quantity)}
              />
            ))}
          </ListCard>
        ))}
    </>
  );
}

/** Consecutive entries of the same start day, in the order the API sent them (newest first). */
function byDay(productions: ReadonlyArray<Production>): Array<[string, Production[]]> {
  const days: Array<[string, Production[]]> = [];
  for (const production of productions) {
    const last = days.at(-1);
    if (last && last[0] === production.startedOn) last[1].push(production);
    else days.push([production.startedOn, [production]]);
  }
  return days;
}

interface FiltersProps {
  moulders: ReadonlyArray<Moulder>;
  filters: ProductionFilters;
  onChange: (filters: ProductionFilters) => void;
  /** What the list below adds up to; null while there is nothing to add. */
  total: string | null;
}

/** A moulder, a period, or both; an empty control means no filter on that side. */
function Filters({ moulders, filters, onChange, total }: FiltersProps) {
  const { t } = useTranslation();
  const set = (patch: ProductionFilters) => onChange({ ...filters, ...patch });

  return (
    <FilterPanel active={Object.values(filters).some(Boolean)} total={total}>
      <FilterControl label={t('common.moulderLabel')}>
        {(id) => (
          <SelectInput
            id={id}
            value={filters.moulderId ?? ''}
            onChange={(value) => set({ moulderId: value || undefined })}
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
      <div className="grid grid-cols-2 gap-3">
        <FilterControl label={t('common.from')}>
          {(id) => (
            <DateInput
              id={id}
              describedBy={undefined}
              invalid={false}
              value={filters.from ?? ''}
              onChange={(iso) => set({ from: iso || undefined })}
              onBlur={() => undefined}
            />
          )}
        </FilterControl>
        <FilterControl label={t('common.to')}>
          {(id) => (
            <DateInput
              id={id}
              describedBy={undefined}
              invalid={false}
              value={filters.to ?? ''}
              onChange={(iso) => set({ to: iso || undefined })}
              onBlur={() => undefined}
            />
          )}
        </FilterControl>
      </div>
    </FilterPanel>
  );
}
