import { Link } from 'react-router';
import { useClients } from './useClients.js';

export function ClientsPage() {
  const clients = useClients();

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Clients</h1>
      <p>
        <Link to="/clients/nouveau">Nouveau client</Link>
      </p>
      {clients.isPending && <p role="status">Chargement…</p>}
      {clients.isError && <p role="alert">Chargement impossible : {clients.error.message}</p>}
      {clients.isSuccess &&
        (clients.data.length === 0 ? (
          <p>Aucun client.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {clients.data.map((client) => (
              <li
                key={client.id}
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                }}
              >
                <Link to={`/clients/${client.id}`}>{client.name}</Link>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>
                  {client.locality}
                  {client.phone !== null && ` · ${client.phone}`}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </main>
  );
}
