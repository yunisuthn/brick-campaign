import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { loadErrorMessage } from '../api/loadError.js';
import { RiceFieldExpenses } from '../expenses/RiceFieldExpenses.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { riceFieldLine } from './RiceFieldsPage.js';
import { RiceFieldFields } from './riceFieldFields.js';
import {
  type NewRiceField,
  type RiceField,
  useRiceField,
  useUpdateRiceField,
} from './useRiceFields.js';

export function RiceFieldPage() {
  const { id = '' } = useParams();
  const field = useRiceField(id);
  const { t } = useTranslation();
  const back = { to: '/rizieres', label: t('riceFields.allRiceFields') };

  if (!field.isSuccess) {
    return (
      <Screen>
        <PageHeader title={t('riceFields.title')} back={back} />
        {field.isError ? (
          <ErrorNote message={loadErrorMessage(field.error, t('riceFields.notFound'), t)} />
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
      <PageHeader title={field.data.name} subtitle={riceFieldLine(field.data, t)} back={back} />
      <RiceFieldExpenses riceFieldId={field.data.id} />
      <RiceFieldForm key={field.data.id} field={field.data} />
    </Screen>
  );
}

/** Always open, like the moulder's: a rice field is corrected more often than read. */
function RiceFieldForm({ field }: { field: RiceField }) {
  const update = useUpdateRiceField(field.id);
  const { t } = useTranslation();
  const form = useForm<NewRiceField>({
    defaultValues: {
      name: field.name,
      location: field.location,
      surfaceM2: field.surfaceM2,
      contractType: field.contractType,
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((input) =>
    update.mutate(input, { onSuccess: (saved) => form.reset(saved) }),
  );

  return (
    <SectionCard title={t('common.edit')}>
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <RiceFieldFields
          register={form.register}
          control={form.control}
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
  );
}
