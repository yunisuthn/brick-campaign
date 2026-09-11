import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { useContractorBalances } from '../balances/useBalances.js';
import { useCurrentCampaign } from '../campaigns/currentCampaign.js';
import { formatAmount, today } from '../format.js';
import { useMoulders } from '../moulders/useMoulders.js';
import { type PaymentForm, PaymentFields, toNewPayment } from './paymentFields.js';
import { useCreatePayment } from './usePayments.js';

export function NewPaymentPage() {
  const { campaign } = useCurrentCampaign();

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <p>
        <Link to="/versements">Tous les versements</Link>
      </p>
      <h1>Nouveau versement</h1>
      {campaign ? (
        <EntryForm campaignId={campaign.id} />
      ) : (
        <p>
          Aucune campagne : <Link to="/campagnes/nouvelle">créez la première</Link> avant de saisir
          un versement.
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
    return <p role="alert">Chargement impossible : {error?.message}</p>;
  }
  if (!moulders.isSuccess || !contractors.isSuccess) return <p role="status">Chargement…</p>;

  const submit = form.handleSubmit((values) =>
    create.mutate(toNewPayment(values), {
      onSuccess: (payment) => {
        const name =
          payment.contractorName ??
          moulders.data.find((m) => m.id === payment.moulderId)?.name ??
          '';
        setSaved(`Enregistré : ${name}, ${formatAmount(payment.amount)}.`);
        form.reset({ ...values, moulderId: '', contractorName: '', amount: '' });
      },
    }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <PaymentFields
        register={form.register}
        watch={form.watch}
        errors={form.formState.errors}
        moulders={moulders.data}
        contractorNames={contractors.data.map((c) => c.contractorName)}
      />
      {create.isError && (
        <p role="alert" style={{ color: 'var(--error)' }}>
          Enregistrement impossible : {apiErrorMessage(create.error)}
        </p>
      )}
      {saved && !create.isError && (
        <p role="status" style={{ color: 'var(--ok)' }}>
          {saved}
        </p>
      )}
      <p>
        <button type="submit" disabled={create.isPending}>
          Enregistrer
        </button>
      </p>
    </form>
  );
}
