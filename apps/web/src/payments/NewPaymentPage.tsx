import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RouteSheet, SheetActions } from '@/components/RouteSheet';
import { ErrorNote, NoCampaign } from '@/components/states';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { type PaymentForm, PaymentFields, toNewPayment } from './paymentFields.js';
import { useCreatePayment } from './usePayments.js';

/** A new payment, in a sheet over the list (reference document, section 10.12). */
export function NewPaymentPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <RouteSheet
      title={t('payments.newTitle')}
      description={
        campaign && t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })
      }
      closeTo="/versements"
    >
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
      ) : (
        <NoCampaign suffix="payments.noCampaignSuffix" />
      )}
    </RouteSheet>
  );
}

/**
 * A round of vatsy goes through the moulders one after the other, so a save keeps the form,
 * its date and its type, clears the beneficiary and the amount, and says what was just paid.
 * Only active moulders are offered.
 */
function EntryForm({ campaignId }: { campaignId: string }) {
  const moulders = useMoulders();
  const contractors = useContractorBalances(campaignId);
  const create = useCreatePayment(campaignId);
  const [saved, setSaved] = useState<string | null>(null);
  const { t } = useTranslation();
  const form = useForm<PaymentForm>({
    defaultValues: {
      date: today(),
      kind: 'moulder',
      moulderId: '',
      contractorName: '',
      type: 'vatsy',
      amount: '',
    },
  });

  if (moulders.isError || contractors.isError) {
    const error = moulders.error ?? contractors.error;
    return (
      <ErrorNote prefix={t('common.loadFailedPrefix')} message={error && apiErrorMessage(error)} />
    );
  }
  if (!moulders.isSuccess || !contractors.isSuccess) {
    return (
      <p role="status" className="text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewPayment(values), {
      onSuccess: (payment) => {
        const name =
          payment.contractorName ??
          moulders.data.find((m) => m.id === payment.moulderId)?.name ??
          '';
        setSaved(t('payments.savedMessage', { name, amount: formatAmount(payment.amount) }));
        form.reset({ ...values, moulderId: '', contractorName: '', amount: '' });
      },
    }),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <PaymentFields
        register={form.register}
        watch={form.watch}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        moulders={moulders.data}
        contractorNames={contractors.data.map((c) => c.contractorName)}
      />
      {createRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      {saved && !create.isError && (
        <p
          role="status"
          className="rounded-[10px] bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {saved}
        </p>
      )}
      <SheetActions submitLabel={t('common.save')} busy={create.isPending} />
    </form>
  );
}
