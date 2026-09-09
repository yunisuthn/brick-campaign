import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

interface HealthReport {
  status: 'ok';
  database: 'up';
}

/** Placeholder home until step 3 of the front plan: proves the build, the proxy and the API talk. */
export function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<HealthReport>('/health'),
  });

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Briqueterie</h1>
      <p role="status">
        {health.isPending && 'Vérification de l’API…'}
        {health.isSuccess && 'API disponible.'}
        {health.isError && `API indisponible : ${health.error.message}`}
      </p>
    </main>
  );
}
