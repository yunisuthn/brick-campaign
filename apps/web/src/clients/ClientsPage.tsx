import { Plus, UserRound } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { ListCard, ListRow } from '@/components/ListCard';
import { Initials } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useClients } from './useClients.js';

/** The clients; a new one and a correction open in a sheet over the list (section 10.12). */
export function ClientsPage() {
  const clients = useClients();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader title={t('clients.title')} />
      <Button asChild>
        <Link to="/clients/nouveau">
          <Plus aria-hidden="true" />
          {t('clients.newLink')}
        </Link>
      </Button>
      {clients.isPending && <LoadingList />}
      {clients.isError && (
        <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(clients.error)} />
      )}
      {clients.isSuccess &&
        (clients.data.length === 0 ? (
          <EmptyState icon={UserRound} title={t('clients.none')} />
        ) : (
          <ListCard label={t('clients.title')}>
            {clients.data.map((client) => (
              <ListRow
                key={client.id}
                to={`/clients/${client.id}`}
                title={client.name}
                subtitle={`${client.locality}${client.phone !== null ? ` · ${client.phone}` : ''}`}
                leading={<Initials name={client.name} />}
              />
            ))}
          </ListCard>
        ))}
      <Outlet />
    </Screen>
  );
}
