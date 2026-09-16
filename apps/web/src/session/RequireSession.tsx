import { Navigate, Outlet, useLocation } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useSession } from './useSession.js';

/**
 * Wraps every route but the login one. While the session loads, only the title shows: a
 * flash of the login form for someone already signed in would be worse than a blank beat.
 * Signed out, the requested URL travels in the location state so login can come back to it.
 */
export function RequireSession() {
  const session = useSession();
  const location = useLocation();
  const { t } = useTranslation();

  if (session.isPending) {
    return (
      <main className="page-wide">
        <h1>{t('shell.appName')}</h1>
      </main>
    );
  }
  if (session.isError) {
    return (
      <main className="page-wide">
        <h1>{t('shell.appName')}</h1>
        <p role="alert">
          {t('session.apiUnavailablePrefix')} {apiErrorMessage(session.error)}
        </p>
      </main>
    );
  }
  if (session.data === null) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
