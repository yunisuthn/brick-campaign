import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useClients } from './useClients.js';

export function ClientsPage() {
  const clients = useClients();
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <h1>{t('clients.title')}</h1>
      <p>
        <Link to="/clients/nouveau">{t('clients.newLink')}</Link>
      </p>
      {clients.isPending && <p role="status">{t('common.loading')}</p>}
      {clients.isError && (
        <p role="alert">
          {t('common.loadFailedPrefix')} {apiErrorMessage(clients.error)}
        </p>
      )}
      {clients.isSuccess &&
        (clients.data.length === 0 ? (
          <p>{t('clients.none')}</p>
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
