import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { CONTRACT_LABELS, surfaceText } from './riceFieldFields.js';
import { useRiceFields } from './useRiceFields.js';

export function RiceFieldsPage() {
  const fields = useRiceFields();

  return (
    <main style={{ padding: '1rem' }}>
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
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {fields.data.map((field) => (
              <li
                key={field.id}
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                }}
              >
                <Link to={`/rizieres/${field.id}`}>{field.name}</Link>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>
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
