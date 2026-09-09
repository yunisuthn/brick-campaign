import { Outlet, useNavigate } from 'react-router';
import { useLogout, useSession } from './useSession.js';

/** Header shared by every signed-in screen: who is in, and the way out. */
export function AppShell() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  const signOut = () =>
    logout.mutate(undefined, { onSuccess: () => navigate('/connexion', { replace: true }) });

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: 'var(--brick)',
          color: 'white',
        }}
      >
        <strong>Briqueterie</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>{session.data?.email}</span>
          <button type="button" onClick={signOut} disabled={logout.isPending}>
            Déconnexion
          </button>
        </span>
      </header>
      <Outlet />
    </>
  );
}
