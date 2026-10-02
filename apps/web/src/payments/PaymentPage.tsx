import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { ConfirmStrip } from '@/components/ConfirmStrip';
import { RouteSheet } from '@/components/RouteSheet';
import { ErrorNote } from '@/components/states';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '../api/errorMessages.js';
import { loadErrorMessage } from '../api/loadError.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useFormat } from '../i18n/useFormat.js';
import { type Moulder, useMoulders } from '../moulders/useMoulders.js';
import {
  PAYMENT_TYPE_KEY,
  type PaymentForm,
  PaymentFields,
  toNewPayment,
} from './paymentFields.js';
import { type Payment, useCancelPayment, usePayment, useUpdatePayment } from './usePayments.js';

/** A payment's correction, in a sheet over the list (reference document, section 10.12). */
export function PaymentPage() {
  const { id = '' } = useParams();
  const { campaign } = useCurrentCampaign();
  const { t } = useTranslation();

  if (!campaign) {
    return (
      <RouteSheet title={t('payments.title')} closeTo="/versements">
        <p className="text-muted-foreground">{t('common.noCampaignShort')}</p>
      </RouteSheet>
    );
  }
  return <LoadedPayment campaignId={campaign.id} id={id} />;
}

/** The payment, the moulders it may name (its own even if retired) and the known contractor names. */
function LoadedPayment({ campaignId, id }: { campaignId: string; id: string }) {
  const payment = usePayment(campaignId, id);
  const moulders = useMoulders(true);
  const contractors = useContractorBalances(campaignId);
  const { t } = useTranslation();

  const failed = [moulders, contractors].find((query) => query.isError);
  if (!payment.isSuccess || !moulders.isSuccess || !contractors.isSuccess) {
    return (
      <RouteSheet title={t('payments.title')} closeTo="/versements">
        {payment.isError ? (
          <ErrorNote message={loadErrorMessage(payment.error, t('payments.notFound'), t)} />
        ) : failed ? (
          <ErrorNote
            prefix={t('common.loadFailedPrefix')}
            message={failed.error && apiErrorMessage(failed.error)}
          />
        ) : (
          <p role="status" className="text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
      </RouteSheet>
    );
  }

  const choosable = moulders.data.filter((m) => m.active || m.id === payment.data.moulderId);
  return (
    <CorrectionForm
      key={payment.data.id}
      payment={payment.data}
      moulders={choosable}
      contractorNames={contractors.data.map((c) => c.contractorName)}
    />
  );
}

interface CorrectionFormProps {
  payment: Payment;
  moulders: ReadonlyArray<Pick<Moulder, 'id' | 'name'>>;
  contractorNames: ReadonlyArray<string>;
}

/**
 * A correction sends the whole payment back, beneficiary included: the API replaces one kind
 * of beneficiary with the other. Cancelling asks for a second step, then goes back to the
 * list; the row stays in the database (reference document, section 5).
 */
function CorrectionForm({ payment, moulders, contractorNames }: CorrectionFormProps) {
  const update = useUpdatePayment(payment.campaignId, payment.id);
  const cancel = useCancelPayment(payment.campaignId, payment.id);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<PaymentForm>({
    defaultValues: {
      date: payment.date,
      kind: payment.contractorName === null ? 'moulder' : 'contractor',
      moulderId: payment.moulderId ?? '',
      contractorName: payment.contractorName ?? '',
      type: payment.type,
      amount: String(payment.amount),
    },
  });

  const updateRefusal = apiFormErrors(update, form);

  const save = form.handleSubmit((values) =>
    update.mutate(toNewPayment(values), {
      onSuccess: (saved) => form.reset({ ...values, amount: String(saved.amount) }),
    }),
  );
  const cancelPayment = () =>
    cancel.mutate(undefined, { onSuccess: () => void navigate('/versements') });

  const name =
    payment.contractorName ?? moulders.find((m) => m.id === payment.moulderId)?.name ?? '';
  const busy = update.isPending || cancel.isPending;
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <RouteSheet
      title={`${name}, ${format.date(payment.date)}`}
      description={`${t(PAYMENT_TYPE_KEY[payment.type])} · ${format.amount(payment.amount)}`}
      closeTo="/versements"
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <PaymentFields
          register={form.register}
          watch={form.watch}
          control={form.control}
          errors={{ ...form.formState.errors, ...updateRefusal.fields }}
          moulders={moulders}
          contractorNames={contractorNames}
        />
        {updateRefusal.message && (
          <p role="alert" className="text-sm text-destructive">
            {t('common.saveFailedPrefix')} {updateRefusal.message}
          </p>
        )}
        {cancel.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('common.cancelFailedPrefix')} {apiErrorMessage(cancel.error)}
          </p>
        )}
        <Button type="submit" disabled={busy || !form.formState.isDirty}>
          {t('common.save')}
        </Button>
        {confirming ? (
          <ConfirmStrip
            confirmLabel={t('common.confirmCancellation')}
            keepLabel={t('payments.keepPayment')}
            onConfirm={cancelPayment}
            onKeep={() => setConfirming(false)}
            busy={busy}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
            disabled={busy}
          >
            {t('payments.cancelPayment')}
          </Button>
        )}
      </form>
    </RouteSheet>
  );
}
