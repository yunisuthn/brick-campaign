import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { RiceFieldExpenses } from '../expenses/RiceFieldExpenses.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
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

  return (
    <main className="page">
      <p>
        <Link to="/rizieres">{t('riceFields.allRiceFields')}</Link>
      </p>
      {field.isPending && <p role="status">{t('common.loading')}</p>}
      {field.isError && (
        <p role="alert">{loadErrorMessage(field.error, t('riceFields.notFound'))}</p>
      )}
      {field.isSuccess && <RiceFieldForm key={field.data.id} field={field.data} />}
    </main>
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
    <>
      <h1>{field.name}</h1>
      <form onSubmit={save} noValidate>
        <RiceFieldFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
        />
        {updateRefusal.message && (
          <p role="alert">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        <p>
          <button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {t('common.save')}
          </button>
        </p>
      </form>
      <RiceFieldExpenses riceFieldId={field.id} />
    </>
  );
}
