import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { useTranslation } from '@/i18n/I18nProvider';
import { useFormat } from '@/i18n/useFormat';
import type { Stock } from '@/stock/useStock';

const levels = [
  { key: 'raw', label: 'dashboard.stock.raw', swatch: 'bg-stock-raw' },
  { key: 'inKiln', label: 'dashboard.stock.inKiln', swatch: 'bg-stock-kiln' },
  { key: 'fired', label: 'dashboard.stock.fired', swatch: 'bg-stock-fired' },
] as const;

/**
 * The three levels the owner counts, and how the bricks on hand split between them: on the
 * dashboard, and above the batches that move bricks from one level to the next.
 */
export function StockCard({ stock }: { stock: Stock }) {
  const { t } = useTranslation();
  const format = useFormat();
  const onHand = stock.raw + stock.inKiln + stock.fired;

  return (
    <SectionCard title={t('dashboard.stock.title')}>
      <dl className="grid grid-cols-3 gap-2">
        {levels.map((level) => (
          <StatCard
            key={level.key}
            label={t(level.label)}
            value={format.count(stock[level.key])}
            swatchClassName={level.swatch}
          />
        ))}
      </dl>
      {onHand === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.stock.empty')}</p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {levels.map((level) =>
              stock[level.key] > 0 ? (
                <div
                  key={level.key}
                  className={level.swatch}
                  style={{ width: `${(stock[level.key] / onHand) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('dashboard.stock.summary', {
              fired: format.bricks(stock.fired),
              total: format.bricks(onHand),
            })}
          </p>
        </>
      )}
    </SectionCard>
  );
}
