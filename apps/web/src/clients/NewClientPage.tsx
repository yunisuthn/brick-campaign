import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { ClientFields } from './clientFields.js';
import { type NewClient, useCreateClient } from './useClients.js';

/** A new client, in a sheet over the list (reference document, section 10.12). */
export function NewClientPage() {
  const create = useCreateClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewClient>({ defaultValues: { name: '', phone: null, locality: '' } });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => void navigate('/clients') }),
  );

  return (
    <RouteSheet title={t('clients.newTitle')} closeTo="/clients">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <ClientFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('clients.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <SheetActions submitLabel={t('clients.createButton')} busy={create.isPending} />
      </form>
    </RouteSheet>
  );
}
