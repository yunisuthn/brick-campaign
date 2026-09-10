import { useState } from 'react';
import { Link } from 'react-router';
import { membersText } from './moulderFields.js';
import { useMoulders } from './useMoulders.js';

export function MouldersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const moulders = useMoulders(includeInactive);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Mouleurs</h1>
      <p style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/mouleurs/nouveau">Nouveau mouleur</Link>
        <label style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Afficher les mouleurs retirés
        </label>
      </p>
      {moulders.isPending && <p role="status">Chargement…</p>}
      {moulders.isError && <p role="alert">Chargement impossible : {moulders.error.message}</p>}
      {moulders.isSuccess &&
        (moulders.data.length === 0 ? (
          <p>Aucun mouleur.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {moulders.data.map((moulder) => (
              <li
                key={moulder.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  opacity: moulder.active ? 1 : 0.6,
                }}
              >
                <Link to={`/mouleurs/${moulder.id}`}>{moulder.name}</Link>
                <span>
                  {membersText(moulder.memberCount)}
                  {!moulder.active && ' · retiré'}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
