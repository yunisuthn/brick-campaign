import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useClients } from './useClients.js';

export function ClientsPage() {
  const clients = useClients();

  return (
    <main className="page-wide">
      <h1>Clients</h1>
      <p>
        <Link to="/clients/nouveau">Nouveau client</Link>
      </p>
      {clients.isPending && <p role="status">Chargement…</p>}
      {clients.isError && (
        <p role="alert">Chargement impossible : {apiErrorMessage(clients.error)}</p>
      )}
      {clients.isSuccess &&
        (clients.data.length === 0 ? (
          <p>Aucun client.</p>
        ) : (
          <ul className="rows">
            {clients.data.map((client) => (
              <li key={client.id}>
                <Link to={`/clients/${client.id}`}>{client.name}</Link>
                <span className="sub">
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
