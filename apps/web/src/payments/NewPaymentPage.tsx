import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { formatAmount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { type PaymentForm, PaymentFields, toNewPayment } from './paymentFields.js';
import { useCreatePayment } from './usePayments.js';

export function NewPaymentPage() {
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  return (
    <main className="page">
      <p>
        <Link to="/versements">{t('payments.allPayments')}</Link>
      </p>
      <h1>{t('payments.newTitle')}</h1>
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
      ) : (
        <p>
          {t('common.noCampaignPrefix')}{' '}
          <Link to="/campagnes/nouvelle">{t('common.noCampaignLinkText')}</Link>
          {t('payments.noCampaignSuffix')}
        </p>
      )}
    </main>
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
      <p role="alert">
        {t('common.loadFailedPrefix')} {error && apiErrorMessage(error)}
      </p>
    );
  }
  if (!moulders.isSuccess || !contractors.isSuccess) {
    return <p role="status">{t('common.loading')}</p>;
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
    <form onSubmit={submit} noValidate>
      <PaymentFields
        register={form.register}
        watch={form.watch}
        control={form.control}
        errors={{ ...form.formState.errors, ...createRefusal.fields }}
        moulders={moulders.data}
        contractorNames={contractors.data.map((c) => c.contractorName)}
      />
      {createRefusal.message && (
        <p role="alert">
          {t('common.saveFailedPrefix')} {createRefusal.message}
        </p>
      )}
      {saved && !create.isError && (
        <p role="status" className="done">
          {saved}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          {t('common.save')}
        </button>
      </p>
    </form>
  );
}
