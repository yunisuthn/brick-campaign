import { formatBricks } from '../format.js';
import type { Stock } from './useStock.js';

/** The three levels the owner counts: not yet fired, in the kiln, ready to sell. */
export function StockSummary({ stock }: { stock: Stock }) {
  const levels = [
    { label: 'Crue', value: stock.raw },
    { label: 'Au four', value: stock.inKiln },
    { label: 'Cuite', value: stock.fired },
  ];

  return (
    <section aria-label="Stock" className="card">
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
