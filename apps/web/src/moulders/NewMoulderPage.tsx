import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { MoulderFields } from './moulderFields.js';
import { type NewMoulder, useCreateMoulder } from './useMoulders.js';

/** Back to the list, not to the new page: a moulder is created once and then only entered against. */
export function NewMoulderPage() {
  const create = useCreateMoulder();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewMoulder>({ defaultValues: { name: '', memberCount: 1 } });

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: () => navigate('/mouleurs') }),
  );

  return (
    <main className="page">
      <h1>{t('moulders.newTitle')}</h1>
      <form onSubmit={submit} noValidate>
        <MoulderFields
          register={form.register}
          errors={{ ...form.formState.errors, ...createRefusal.fields }}
        />
        {createRefusal.message && (
          <p role="alert">
            {t('moulders.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            {t('moulders.createButton')}
          </button>
          <Link to="/mouleurs">{t('common.cancel')}</Link>
        </p>
      </form>
    </main>
  );
}
