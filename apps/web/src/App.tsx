import { useEffect, useState } from 'react';
import { api } from './api/client.js';

interface HealthReport {
  status: 'ok';
  database: 'up';
}

type Health = { state: 'loading' } | { state: 'up' } | { state: 'down'; message: string };

/** Step 1 of the front plan: a page that proves the build, the proxy and the API talk to each other. */
export function App() {
  const [health, setHealth] = useState<Health>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    api<HealthReport>('/health')
      .then(() => !cancelled && setHealth({ state: 'up' }))
      .catch((error: Error) => !cancelled && setHealth({ state: 'down', message: error.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Briqueterie</h1>
      <p role="status">
        {health.state === 'loading' && 'Vérification de l’API…'}
        {health.state === 'up' && 'API disponible.'}
        {health.state === 'down' && `API indisponible : ${health.message}`}
      </p>
    </main>
  );
}
