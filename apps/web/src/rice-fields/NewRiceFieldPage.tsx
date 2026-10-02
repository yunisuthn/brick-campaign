import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { RiceFieldFields } from './riceFieldFields.js';
import { type NewRiceField, useCreateRiceField } from './useRiceFields.js';

/** A new rice field, in a sheet over the list (reference document, section 10.12). */
export function NewRiceFieldPage() {
  const create = useCreateRiceField();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewRiceField>({
    defaultValues: { name: '', location: '', surfaceM2: null, contractType: 'seasonal' },
  });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => void navigate('/rizieres') }),
  );

  return (
    <RouteSheet title={t('riceFields.newTitle')} closeTo="/rizieres">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <RiceFieldFields
          register={form.register}
          control={form.control}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('riceFields.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <SheetActions submitLabel={t('riceFields.createButton')} busy={create.isPending} />
      </form>
    </RouteSheet>
  );
}
