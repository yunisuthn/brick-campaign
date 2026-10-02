import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { loadErrorMessage } from '../api/loadError.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { MoulderBalance } from './MoulderBalance.js';
import { MoulderFields, membersText } from './moulderFields.js';
import { type Moulder, type NewMoulder, useMoulder, useUpdateMoulder } from './useMoulders.js';

export function MoulderPage() {
  const { id = '' } = useParams();
  const moulder = useMoulder(id);
  const { t } = useTranslation();
  const back = { to: '/mouleurs', label: t('moulders.allMoulders') };

  if (!moulder.isSuccess) {
    return (
      <Screen>
        <PageHeader title={t('moulders.title')} back={back} />
        {moulder.isError ? (
          <ErrorNote message={loadErrorMessage(moulder.error, t('moulders.notFound'), t)} />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </Screen>
    );
  }
  return (
    <Screen>
      <MoulderForm key={moulder.data.id} moulder={moulder.data} back={back} />
    </Screen>
  );
}

/**
 * What the moulder is owed first, then the form, always open: a moulder has two fields and
 * correcting a name is the common case. Retiring is the only way out (reference document,
 * section 5: no physical delete), and it can be undone.
 */
function MoulderForm({ moulder, back }: { moulder: Moulder; back: { to: string; label: string } }) {
  const update = useUpdateMoulder(moulder.id);
  const { t } = useTranslation();
  const form = useForm<NewMoulder>({
    defaultValues: { name: moulder.name, memberCount: moulder.memberCount },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );
  const toggleActive = () => update.mutate({ active: !moulder.active });

  return (
    <>
      <PageHeader
        title={
          <>
            {moulder.name}
            {!moulder.active && (
              <span className="font-normal text-muted-foreground">
                {t('moulders.retiredSuffix')}
              </span>
            )}
          </>
        }
        subtitle={membersText(moulder.memberCount, t)}
        back={back}
      />
      <MoulderBalance moulderId={moulder.id} />
      <SectionCard title={t('common.edit')}>
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <MoulderFields
            register={form.register}
            errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          />
          {updateRefusal.message && (
            <p role="alert" className="text-sm text-destructive">
              {t('common.saveFailedPrefix')} {updateRefusal.message}
            </p>
          )}
          <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {t('common.save')}
          </Button>
        </form>
      </SectionCard>
      <Button
        type="button"
        variant="outline"
        className={
          moulder.active
            ? 'h-auto min-h-11 whitespace-normal text-destructive'
            : 'h-auto min-h-11 whitespace-normal'
        }
        onClick={toggleActive}
        disabled={update.isPending}
      >
        {moulder.active ? t('moulders.retireMoulder') : t('moulders.reactivateMoulder')}
      </Button>
    </>
  );
}
