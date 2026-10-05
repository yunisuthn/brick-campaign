import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { DateField, NumberField } from '@/components/fields';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
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
    create.mutate(input, {
      onSuccess: (campaign) => void navigate(`/campagnes/${campaign.id}`),
    }),
  );

  return (
    <Screen>
      <PageHeader
        title={t('campaigns.newTitle')}
        back={{ to: '/campagnes', label: t('campaigns.allCampaigns') }}
      />
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Card className="gap-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t('campaigns.yearLabel')}
              error={errors.year ?? createRefusal.fields.year}
              registration={form.register('year', {
                setValueAs: (value: string) => Number(digitsOnly(value)),
                validate: (value) =>
                  (Number.isInteger(value) && value >= 2000 && value <= 2100) ||
                  t('campaigns.yearRequired'),
              })}
            />
            <NumberField
              label={t('campaigns.trancheLabel')}
              error={errors.tranche ?? createRefusal.fields.tranche}
              registration={form.register('tranche', {
                setValueAs: (value: string) => Number(digitsOnly(value)),
                validate: (value) =>
                  (Number.isInteger(value) && value >= 1) || t('campaigns.trancheRequired'),
              })}
            />
          </div>
          <DateField
            label={t('campaigns.startedOnLabel')}
            name="startedOn"
            control={form.control}
            error={errors.startedOn ?? createRefusal.fields.startedOn}
            required={t('campaigns.startedOnRequired')}
          />
        </Card>
        <SectionCard title={t('campaigns.ratesFormLabel')}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{t('campaigns.rateHint')}</p>
            <RateFields form={form} errors={{ ...errors, ...createRefusal.fields }} />
          </div>
        </SectionCard>
        {createRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('campaigns.createFailedPrefix')} {createRefusal.message}
          </p>
        )}
        <Button type="submit" disabled={create.isPending}>
          {t('campaigns.createButton')}
        </Button>
      </form>
    </Screen>
  );
}
