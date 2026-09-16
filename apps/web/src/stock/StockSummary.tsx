import { formatBricks } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { Stock } from './useStock.js';

/** The three levels the owner counts: not yet fired, in the kiln, ready to sell. */
export function StockSummary({ stock }: { stock: Stock }) {
  const { t } = useTranslation();
  const levels = [
    { label: t('dashboard.stock.raw'), value: stock.raw },
    { label: t('dashboard.stock.inKiln'), value: stock.inKiln },
    { label: t('dashboard.stock.fired'), value: stock.fired },
  ];

  return (
    <section aria-label={t('dashboard.stock.label')} className="card">
      <dl className="actions">
        {levels.map((level) => (
          <div key={level.label}>
            <dt className="sub">{level.label}</dt>
            <dd className="strong">{formatBricks(level.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
