import { useState } from 'react';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { membersText } from './moulderFields.js';
import { useMoulders } from './useMoulders.js';

export function MouldersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const moulders = useMoulders(includeInactive);

  return (
    <main className="page-wide">
      <h1>Mouleurs</h1>
      <p className="actions">
        <Link to="/mouleurs/nouveau">Nouveau mouleur</Link>
        <label className="actions">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Afficher les mouleurs retirés
        </label>
      </p>
      {moulders.isPending && <p role="status">Chargement…</p>}
      {moulders.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(moulders.error)}</p>
      )}
      {moulders.isSuccess &&
        (moulders.data.length === 0 ? (
          <p>Aucun mouleur.</p>
        ) : (
          <ul className="rows">
            {moulders.data.map((moulder) => (
              <li key={moulder.id} className={`row-split${moulder.active ? '' : ' is-retired'}`}>
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
