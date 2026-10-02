import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { MoulderFields } from './moulderFields.js';
import { type NewMoulder, useCreateMoulder } from './useMoulders.js';

/**
 * A new moulder, in a sheet over the list; back to the list, not to the new page: a moulder is
 * created once and then only entered against.
 */
export function NewMoulderPage() {
  const create = useCreateMoulder();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewMoulder>({ defaultValues: { name: '', memberCount: 1 } });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => void navigate('/mouleurs') }),
  );

  return (
    <RouteSheet title={t('moulders.newTitle')} closeTo="/mouleurs">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <MoulderFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('moulders.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <SheetActions submitLabel={t('moulders.createButton')} busy={create.isPending} />
      </form>
    </RouteSheet>
  );
}
