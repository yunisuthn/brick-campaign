import { Plus, Users } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ListCard, ListRow } from '@/components/ListCard';
import { Initials } from '@/components/marks';
import { PageHeader, Screen } from '@/components/Screen';
import { EmptyState, ErrorNote, LoadingList } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { membersText } from './moulderFields.js';
import { useMoulders } from './useMoulders.js';

/** The moulders, the retired ones on request; a new one opens in a sheet over the list. */
export function MouldersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const moulders = useMoulders(includeInactive);
  const switchId = useId();
  const { t } = useTranslation();

  return (
    <Screen>
      <PageHeader title={t('moulders.title')} />
      <Button asChild className="sm:self-start">
        <Link to="/mouleurs/nouveau">
          <Plus aria-hidden="true" />
          {t('moulders.newLink')}
        </Link>
      </Button>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Label htmlFor={switchId} className="text-[15px] font-normal">
          {t('moulders.showRetired')}
        </Label>
        <Switch id={switchId} checked={includeInactive} onCheckedChange={setIncludeInactive} />
      </div>
      {moulders.isPending && <LoadingList />}
      {moulders.isError && (
        <ErrorNote
          prefix={t('common.loadFailedPrefix')}
          message={apiErrorMessage(moulders.error)}
        />
      )}
      {moulders.isSuccess &&
        (moulders.data.length === 0 ? (
          <EmptyState icon={Users} title={t('moulders.none')} />
        ) : (
          <ListCard label={t('moulders.title')}>
            {moulders.data.map((moulder) => (
              <ListRow
                key={moulder.id}
                to={`/mouleurs/${moulder.id}`}
                title={
                  <span className={moulder.active ? undefined : 'text-muted-foreground'}>
                    {moulder.name}
                  </span>
                }
                subtitle={`${membersText(moulder.memberCount, t)}${
                  moulder.active ? '' : t('moulders.retiredSuffix')
                }`}
                leading={<Initials name={moulder.name} />}
              />
            ))}
          </ListCard>
        ))}
      <Outlet />
    </Screen>
  );
}
