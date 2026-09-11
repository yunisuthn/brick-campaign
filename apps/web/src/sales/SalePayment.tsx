import { useForm } from 'react-hook-form';
import { apiErrorMessage } from '../api/errorMessages.js';
import { Field } from '../form/Field.js';
import { formatAmount, formatDate, today } from '../format.js';
import { type Sale, useUpdateSale } from './useSales.js';

interface PaymentForm {
  paidOn: string;
  amountReceived: string;
}

/**
 * The client pays once, when everything is delivered (reference document, section 1), so the
 * payment is one object: a date and an amount together, or nothing. The amount starts at the
 * total of the sale, which is what is owed; it stays editable for a rounded settlement.
 * Taking the payment back sends `payment: null`, as the API expects.
 */
export function SalePayment({ sale }: { sale: Sale }) {
  const update = useUpdateSale(sale.campaignId, sale.id);
  const form = useForm<PaymentForm>({
    defaultValues: { paidOn: today(), amountReceived: String(sale.total) },
  });

  const record = form.handleSubmit((values) =>
    update.mutate({
      payment: { paidOn: values.paidOn, amountReceived: Number(values.amountReceived) },
    }),
  );

  return (
    <section aria-labelledby="payment" style={{ marginTop: '1.5rem' }}>
      <h2 id="payment" style={{ fontSize: '1.125rem' }}>
        Encaissement
      </h2>
      {sale.payment === null ? (
        <form onSubmit={record} noValidate>
          <Field
            label="Date du paiement"
            error={form.formState.errors.paidOn}
            input={form.register('paidOn', { required: 'La date est requise.' })}
            type="date"
          />
          <Field
            label="Montant encaissé (Ar)"
            error={form.formState.errors.amountReceived}
            input={form.register('amountReceived', {
              validate: (value) =>
                (/^\d+$/.test(value.trim()) && Number(value) > 0) ||
                'Un montant entier en ariary est attendu.',
            })}
            inputMode="numeric"
          />
          {update.isError && (
            <p role="alert" style={{ color: 'var(--error)' }}>
              Encaissement impossible : {apiErrorMessage(update.error)}
            </p>
          )}
          <p>
            <button type="submit" disabled={update.isPending}>
              Encaisser
            </button>
          </p>
        </form>
      ) : (
        <>
          <p>
            {formatAmount(sale.payment.amountReceived)} reçus le {formatDate(sale.payment.paidOn)}.
          </p>
          {update.isError && (
            <p role="alert" style={{ color: 'var(--error)' }}>
              Reprise impossible : {apiErrorMessage(update.error)}
            </p>
          )}
          <p>
            <button
              type="button"
              onClick={() => update.mutate({ payment: null })}
              disabled={update.isPending}
            >
              Reprendre l’encaissement
            </button>
          </p>
        </>
      )}
    </section>
  );
}
