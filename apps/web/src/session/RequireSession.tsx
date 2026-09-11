import { Navigate, Outlet, useLocation } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useSession } from './useSession.js';

/**
 * Wraps every route but the login one. While the session loads, only the title shows: a
 * flash of the login form for someone already signed in would be worse than a blank beat.
 * Signed out, the requested URL travels in the location state so login can come back to it.
 */
export function RequireSession() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <main style={{ padding: '1rem' }}>
        <h1>Briqueterie</h1>
      </main>
    );
  }
  if (session.isError) {
    return (
      <main style={{ padding: '1rem' }}>
        <h1>Briqueterie</h1>
        <p role="alert">API indisponible : {apiErrorMessage(session.error)}</p>
      </main>
    );
  }
  if (session.data === null) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
