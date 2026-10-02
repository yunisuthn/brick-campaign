import { CalendarDays, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { DateField } from '@/components/fields';
import { PageHeader, Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { loadErrorMessage } from '../api/loadError.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { CampaignRatesList, CampaignState } from './CampaignFacts.js';
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
  const back = { to: '/campagnes', label: t('campaigns.allCampaigns') };

  if (!campaign.isSuccess) {
    return (
      <Screen>
        <PageHeader title={t('campaigns.title')} back={back} />
        {campaign.isError ? (
          <ErrorNote message={loadErrorMessage(campaign.error, t('campaigns.notFound'))} />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </Screen>
    );
  }

  const data = campaign.data;
  return (
    <Screen>
      <PageHeader
        title={t('campaigns.cardTitle', { year: data.year, tranche: data.tranche })}
        subtitle={<CampaignState campaign={data} />}
        back={back}
      />
      <SectionCard title={t('campaigns.ratesFormLabel')}>
        <div className="flex flex-col gap-3">
          <CampaignRatesList campaign={data} />
          <EditRates campaign={data} />
        </div>
      </SectionCard>
      <EditStartDate campaign={data} />
      {data.closedOn === null && <CloseCampaign campaign={data} />}
    </Screen>
  );
}

/**
 * The start date can be corrected after the fact; the API refuses one that falls after the
 * closing date and its message is shown.
 */
function EditStartDate({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const update = useUpdateCampaign(campaign.id);
  const { t } = useTranslation();
  const format = useFormat();
  const form = useForm<{ startedOn: string }>({
    defaultValues: { startedOn: campaign.startedOn },
  });

  const refusal = apiFormErrors(update, form);

  const submit = form.handleSubmit(({ startedOn }) =>
    update.mutate({ startedOn }, { onSuccess: () => setOpen(false) }),
  );

  return (
    <SectionCard title={t('campaigns.startedOnLabel')}>
      {open ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <DateField
            label={t('campaigns.startedOnLabel')}
            name="startedOn"
            control={form.control}
            error={form.formState.errors.startedOn ?? refusal.fields.startedOn}
            required={t('campaigns.startedOnRequired')}
          />
          {refusal.message && (
            <p role="alert" className="text-sm text-destructive">
              {t('common.saveFailedPrefix')} {refusal.message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p>{format.date(campaign.startedOn)}</p>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <CalendarDays aria-hidden="true" />
            {t('campaigns.editStartDate')}
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

/**
 * The rates are fixed here once negotiated, and can be corrected later; a rate fixed after
 * the fact applies to the whole campaign (reference document, section 4). They open in a sheet
 * from the bottom, like every form of the redesign (section 10.12).
 */
function EditRates({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Pencil aria-hidden="true" />
          {t('campaigns.editRates')}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        closeLabel={t('common.close')}
        className="mx-auto max-h-[92dvh] max-w-md gap-0 overflow-y-auto rounded-t-xl"
      >
        <SheetHeader className="pr-14">
          <SheetTitle className="text-lg">{t('campaigns.ratesFormLabel')}</SheetTitle>
          <SheetDescription>
            {t('campaigns.cardTitle', { year: campaign.year, tranche: campaign.tranche })}
          </SheetDescription>
        </SheetHeader>
        <RatesForm campaign={campaign} onDone={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function RatesForm({ campaign, onDone }: { campaign: Campaign; onDone: () => void }) {
  const update = useUpdateCampaign(campaign.id);
  const { t } = useTranslation();
  const form = useForm<CampaignRates>({
    defaultValues: {
      mouldingRates: campaign.mouldingRates,
      transportRates: campaign.transportRates,
      kilnLoadingRate: campaign.kilnLoadingRate,
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const submit = form.handleSubmit((rates) => update.mutate(rates, { onSuccess: onDone }));

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={t('campaigns.ratesFormLabel')}
      className="flex flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <RateFields form={form} errors={{ ...form.formState.errors, ...updateRefusal.fields }} />
      {updateRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {updateRefusal.message}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 whitespace-normal"
          onClick={onDone}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          className="h-auto min-h-11 whitespace-normal"
          disabled={update.isPending}
        >
          {t('campaigns.saveRates')}
        </Button>
      </div>
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
      <Button
        type="button"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        {t('campaigns.closeCampaign')}
      </Button>
    );
  }

  const closeRefusal = apiFormErrors(close, form);

  const submit = form.handleSubmit(({ closedOn }) => close.mutate({ closedOn }));

  return (
    <SectionCard title={t('campaigns.closeCampaign')} className="border-destructive/25">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <DateField
          label={t('campaigns.closedOnLabel')}
          name="closedOn"
          control={form.control}
          error={form.formState.errors.closedOn ?? closeRefusal.fields.closedOn}
          required={t('campaigns.closedOnRequired')}
        />
        {closeRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('campaigns.closeFailedPrefix')} {closeRefusal.message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            onClick={() => setOpen(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="h-auto min-h-11 whitespace-normal"
            disabled={close.isPending}
          >
            {t('campaigns.confirmClose')}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
