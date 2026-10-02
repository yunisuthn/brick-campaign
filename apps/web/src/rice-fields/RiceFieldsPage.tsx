import { Plus, Sprout } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { ListCard, ListRow } from '@/components/ListCard';
import { IconTile } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CONTRACT_TYPE_KEY, surfaceText } from './riceFieldFields.js';
import { useRiceFields } from './useRiceFields.js';

/** The rice fields; a new one opens in a sheet over the list (section 10.12). */
export function RiceFieldsPage() {
  const fields = useRiceFields();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader title={t('riceFields.title')} />
      <Button asChild>
        <Link to="/rizieres/nouvelle">
          <Plus aria-hidden="true" />
          {t('riceFields.newLink')}
        </Link>
      </Button>
      {fields.isPending && <LoadingList />}
      {fields.isError && (
        <ErrorNote prefix={t('common.loadFailedPrefix')} message={apiErrorMessage(fields.error)} />
      )}
      {fields.isSuccess &&
        (fields.data.length === 0 ? (
          <EmptyState icon={Sprout} title={t('riceFields.none')} />
        ) : (
          <ListCard label={t('riceFields.title')}>
            {fields.data.map((field) => (
              <ListRow
                key={field.id}
                to={`/rizieres/${field.id}`}
                title={field.name}
                subtitle={riceFieldLine(field, t)}
                leading={<IconTile icon={Sprout} />}
              />
            ))}
          </ListCard>
        ))}
      <Outlet />
    </Screen>
  );
}

/** Where, how large, and on what contract: "Sud · 2500 m² · contrat durable". */
export function riceFieldLine(
  field: {
    location: string;
    surfaceM2: number | null;
    contractType: keyof typeof CONTRACT_TYPE_KEY;
  },
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return `${field.location} · ${surfaceText(field.surfaceM2, t)} · ${t(
    'riceFields.contractPrefix',
  )} ${t(CONTRACT_TYPE_KEY[field.contractType]).toLowerCase()}`;
}
