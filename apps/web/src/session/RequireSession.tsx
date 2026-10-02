import { Navigate, Outlet, useLocation } from 'react-router';
import { Screen } from '@/components/Screen';
import { ErrorNote } from '@/components/states';
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
      <Screen className="items-center pt-16">
        <h1 className="text-2xl font-semibold tracking-tight">{t('shell.appName')}</h1>
      </Screen>
    );
  }
  if (session.isError) {
    return (
      <Screen className="pt-16">
        <h1 className="text-center text-2xl font-semibold tracking-tight">{t('shell.appName')}</h1>
        <ErrorNote
          prefix={t('session.apiUnavailablePrefix')}
          message={apiErrorMessage(session.error)}
        />
      </Screen>
    );
  }
  if (session.data === null) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
