import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { DateField } from '../form/DateField.js';
import { Field } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { RateFields } from './rateFields.js';
import { type NewCampaign, useCreateCampaign } from './useCampaigns.js';

export function NewCampaignPage() {
  const create = useCreateCampaign();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const form = useForm<NewCampaign>({
    defaultValues: {
      year: new Date().getFullYear(),
      tranche: 1,
      startedOn: '',
      mouldingRates: [],
      transportRates: [],
      kilnLoadingRate: null,
    },
  });
  const { errors } = form.formState;

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: (campaign) => navigate(`/campagnes/${campaign.id}`) }),
  );

  return (
    <main className="page">
      <h1>{t('campaigns.newTitle')}</h1>
      <form onSubmit={submit} noValidate>
        <Field
          label={t('campaigns.yearLabel')}
          error={errors.year ?? createRefusal.fields.year}
          input={form.register('year', {
            setValueAs: (value: string) => Number(digitsOnly(value)),
            validate: (value) =>
              (Number.isInteger(value) && value >= 2000 && value <= 2100) ||
              t('campaigns.yearRequired'),
          })}
          inputMode="numeric"
        />
        <Field
          label={t('campaigns.trancheLabel')}
          error={errors.tranche ?? createRefusal.fields.tranche}
          input={form.register('tranche', {
            setValueAs: (value: string) => Number(digitsOnly(value)),
            validate: (value) =>
              (Number.isInteger(value) && value >= 1) || t('campaigns.trancheRequired'),
          })}
          inputMode="numeric"
        />
        <DateField
          label={t('campaigns.startedOnLabel')}
          name="startedOn"
          control={form.control}
          error={errors.startedOn ?? createRefusal.fields.startedOn}
          required={t('campaigns.startedOnRequired')}
        />
        <p className="sub">{t('campaigns.rateHint')}</p>
        <RateFields form={form} errors={{ ...errors, ...createRefusal.fields }} />
        {createRefusal.message && (
          <p role="alert">
            {t('campaigns.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            {t('campaigns.createButton')}
          </button>
          <Link to="/campagnes">{t('common.cancel')}</Link>
        </p>
      </form>
    </main>
  );
}
