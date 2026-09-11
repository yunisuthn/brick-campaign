import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { CONTRACT_LABELS, surfaceText } from './riceFieldFields.js';
import { useRiceFields } from './useRiceFields.js';

export function RiceFieldsPage() {
  const fields = useRiceFields();

  return (
    <main className="page-wide">
      <h1>Rizières</h1>
      <p>
        <Link to="/rizieres/nouvelle">Nouvelle rizière</Link>
      </p>
      {fields.isPending && <p role="status">Chargement…</p>}
      {fields.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(fields.error)}</p>
      )}
      {fields.isSuccess &&
        (fields.data.length === 0 ? (
          <p>Aucune rizière.</p>
        ) : (
          <ul className="rows">
            {fields.data.map((field) => (
              <li key={field.id}>
                <Link to={`/rizieres/${field.id}`}>{field.name}</Link>
                <span className="sub">
                  {field.location} · {surfaceText(field.surfaceM2)} · contrat{' '}
                  {CONTRACT_LABELS[field.contractType].toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
