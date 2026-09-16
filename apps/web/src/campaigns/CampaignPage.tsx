import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { loadErrorMessage } from '../api/loadError.js';
import { DateField } from '../form/DateField.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { CampaignFacts } from './CampaignFacts.js';
import { RateFields } from './rateFields.js';
import {
  type Campaign,
  type CampaignRates,
  useCampaign,
  useUpdateCampaign,
} from './useCampaigns.js';

export function CampaignPage() {
  const { id = '' } = useParams();
  const campaign = useCampaign(id);
  const { t } = useTranslation();

  return (
    <main className="page-wide">
      <p>
        <Link to="/campagnes">{t('campaigns.allCampaigns')}</Link>
      </p>
      {campaign.isPending && <p role="status">{t('common.loading')}</p>}
      {campaign.isError && (
        <p role="alert">{loadErrorMessage(campaign.error, t('campaigns.notFound'))}</p>
      )}
      {campaign.isSuccess && (
        <>
          <h1>{t('campaigns.cardTitle', { year: campaign.data.year })}</h1>
          <CampaignFacts campaign={campaign.data} />
          <EditRates campaign={campaign.data} />
          {campaign.data.closedOn === null && <CloseCampaign campaign={campaign.data} />}
        </>
      )}
    </main>
  );
}

/**
 * The rates are fixed here once negotiated, and can be corrected later; a rate fixed after
 * the fact applies to the whole campaign (reference document, section 4).
 */
function EditRates({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCampaign(campaign.id);
  const { t } = useTranslation();
  const form = useForm<CampaignRates>({
    defaultValues: {
      mouldingRates: campaign.mouldingRates,
      transportRates: campaign.transportRates,
      kilnLoadingRate: campaign.kilnLoadingRate,
    },
  });

  if (!open) {
    return (
      <p>
        <button type="button" onClick={() => setOpen(true)}>
          {t('campaigns.editRates')}
        </button>
      </p>
    );
  }

  const updateRefusal = apiFormErrors(update, form);

  const submit = form.handleSubmit((rates) =>
    update.mutate(rates, { onSuccess: () => setOpen(false) }),
  );

  return (
    <form
      onSubmit={submit}
      noValidate
      className="inline-form"
      aria-label={t('campaigns.ratesFormLabel')}
    >
      <RateFields form={form} errors={{ ...form.formState.errors, ...updateRefusal.fields }} />
      {updateRefusal.message && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {updateRefusal.message}
        </p>
      )}
      <p className="actions">
        <button type="submit" disabled={update.isPending}>
          {t('campaigns.saveRates')}
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </button>
      </p>
    </form>
  );
}

/**
 * Closing asks for the date and nothing else, today by default. The form only shows on request:
 * closing is a once-a-season act, not something to brush against while reading the page.
 * The API keeps the rule that the closing date cannot precede the start; its message is shown.
 */
function CloseCampaign({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const close = useUpdateCampaign(campaign.id);
  const { t } = useTranslation();
  const form = useForm<{ closedOn: string }>({ defaultValues: { closedOn: today() } });

  if (!open) {
    return (
      <p>
        <button type="button" onClick={() => setOpen(true)}>
          {t('campaigns.closeCampaign')}
        </button>
      </p>
    );
  }

  const closeRefusal = apiFormErrors(close, form);

  const submit = form.handleSubmit(({ closedOn }) => close.mutate({ closedOn }));

  return (
    <form onSubmit={submit} noValidate className="inline-form">
      <DateField
        label={t('campaigns.closedOnLabel')}
        name="closedOn"
        control={form.control}
        error={form.formState.errors.closedOn ?? closeRefusal.fields.closedOn}
        required={t('campaigns.closedOnRequired')}
      />
      {closeRefusal.message && (
        <p role="alert">
          {t('campaigns.closeFailedPrefix')} {closeRefusal.message}
        </p>
      )}
      <p className="actions">
        <button type="submit" disabled={close.isPending}>
          {t('campaigns.confirmClose')}
        </button>
        <button type="button" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </button>
      </p>
    </form>
  );
}
