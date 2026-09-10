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
    <section
      aria-label="Stock"
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem 1rem',
        background: 'white',
        borderRadius: '0.5rem',
      }}
    >
      <dl style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: 0 }}>
        {levels.map((level) => (
          <div key={level.label}>
            <dt style={{ fontSize: '0.875rem' }}>{level.label}</dt>
            <dd style={{ margin: 0, fontWeight: 'bold' }}>{formatBricks(level.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
