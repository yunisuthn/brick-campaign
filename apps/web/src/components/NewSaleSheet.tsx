import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { DateInput, FormField, NumberInput } from '@/components/fields';
import { FormSheetContent } from '@/components/RouteSheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { apiErrorMessage } from '../api/errorMessages.js';
import type { Campaign } from '../campaigns/useCampaigns.js';
import { useClients } from '../clients/useClients.js';
import { dashboardKey } from '../dashboard/useDashboard.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
import { digitsOnly } from '../form/numeric.js';
import { formatAmount, today } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import { useCreateSalePaymentOnSale } from '../sale-payments/useSalePayments.js';
import { useCreateSale } from '../sales/useSales.js';

interface SaleSheetForm {
  clientId: string;
  date: string;
  orderedQuantity: string;
  unitPrice: string;
  received: string;
}

/**
 * A sale entered from the dashboard, in a sheet that rises from the bottom (reference
 * document, section 10.11). The sheet's content is only mounted while open, so each opening
 * starts from an empty form.
 */
export function NewSaleSheet({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          {t('dashboard.newSale')}
        </Button>
      </SheetTrigger>
      <FormSheetContent>
        <SheetHeader className="pr-14">
          <SheetTitle className="text-lg">{t('sales.newTitle')}</SheetTitle>
          <SheetDescription>
            {t('common.campaignName', { year: campaign.year, tranche: campaign.tranche })}
          </SheetDescription>
        </SheetHeader>
        <SaleForm campaignId={campaign.id} onDone={() => setOpen(false)} />
      </FormSheetContent>
    </Sheet>
  );
}

/**
 * The sale is created first, then — when something was received — its first instalment: two
 * calls the API already has, nothing new behind them. Should the second one fail, the sale
 * exists already: the sheet says so and links to it, and saving again is no longer offered,
 * since it would enter the sale twice.
 */
function SaleForm({ campaignId, onDone }: { campaignId: string; onDone: () => void }) {
  const clients = useClients();
  const createSale = useCreateSale(campaignId);
  const createPayment = useCreateSalePaymentOnSale(campaignId);
  const queryClient = useQueryClient();
  const [paymentFailure, setPaymentFailure] = useState<{ saleId: string; message: string } | null>(
    null,
  );
  const { t } = useTranslation();
  const form = useForm<SaleSheetForm>({
    defaultValues: {
      clientId: '',
      date: today(),
      orderedQuantity: '',
      unitPrice: '',
      received: '0',
    },
  });

  if (clients.isError) {
    return (
      <p role="alert" className="px-4 pb-4 text-destructive">
        {t('common.loadFailedPrefix')} {apiErrorMessage(clients.error)}
      </p>
    );
  }
  if (!clients.isSuccess) {
    return (
      <p role="status" className="px-4 pb-4 text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const quantity = Number(digitsOnly(form.watch('orderedQuantity')));
  const unitPrice = Number(digitsOnly(form.watch('unitPrice')));
  const total = Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0;

  const saleRefusal = apiFormErrors(createSale, form);
  const errors = form.formState.errors;
  const busy = createSale.isPending || createPayment.isPending;

  const refreshDashboard = () =>
    queryClient.invalidateQueries({ queryKey: dashboardKey(campaignId) });

  const submit = form.handleSubmit(async (values) => {
    let saleId: string;
    try {
      const sale = await createSale.mutateAsync({
        clientId: values.clientId,
        date: values.date,
        orderedQuantity: Number(digitsOnly(values.orderedQuantity)),
        unitPrice: Number(digitsOnly(values.unitPrice)),
      });
      saleId = sale.id;
    } catch {
      return; // The refusal is shown on the form, from the mutation's own state.
    }
    const received = Number(digitsOnly(values.received));
    if (received > 0) {
      try {
        await createPayment.mutateAsync({ saleId, date: values.date, amount: received });
      } catch (error) {
        setPaymentFailure({ saleId, message: apiErrorMessage(error as Error) });
        void refreshDashboard();
        return;
      }
    }
    await refreshDashboard();
    onDone();
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4">
      <FormField
        label={t('sales.clientLabel')}
        error={errors.clientId ?? saleRefusal.fields.clientId}
      >
        {(id, describedBy) => (
          <Controller
            name="clientId"
            control={form.control}
            rules={{ required: t('sales.clientRequired') }}
            render={({ field, fieldState }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={id}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={describedBy}
                  className="w-full"
                >
                  <SelectValue placeholder={t('common.choose')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.data.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="min-h-11">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <FormField label={t('common.date')} error={errors.date ?? saleRefusal.fields.date}>
        {(id, describedBy) => (
          <Controller
            name="date"
            control={form.control}
            rules={{ required: t('common.dateRequired') }}
            render={({ field, fieldState }) => (
              <DateInput
                id={id}
                describedBy={describedBy}
                invalid={!!fieldState.error}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
              />
            )}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('sales.sheet.quantityLabel')}
          error={errors.orderedQuantity ?? saleRefusal.fields.orderedQuantity}
        >
          {(id, describedBy) => (
            <NumberInput
              id={id}
              describedBy={describedBy}
              invalid={!!(errors.orderedQuantity ?? saleRefusal.fields.orderedQuantity)}
              registration={form.register('orderedQuantity', {
                validate: (value) =>
                  (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
                  t('sales.quantityRequired'),
              })}
            />
          )}
        </FormField>
        <FormField
          label={t('sales.sheet.unitPriceLabel')}
          error={errors.unitPrice ?? saleRefusal.fields.unitPrice}
        >
          {(id, describedBy) => (
            <NumberInput
              id={id}
              describedBy={describedBy}
              invalid={!!(errors.unitPrice ?? saleRefusal.fields.unitPrice)}
              registration={form.register('unitPrice', {
                validate: (value) =>
                  (/^\d+$/.test(digitsOnly(value)) && Number(digitsOnly(value)) > 0) ||
                  t('sales.unitPriceRequired'),
              })}
            />
          )}
        </FormField>
      </div>

      <FormField
        label={t('sales.sheet.receivedLabel')}
        hint={t('sales.sheet.receivedHint')}
        error={errors.received}
      >
        {(id, describedBy) => (
          <NumberInput
            id={id}
            describedBy={describedBy}
            invalid={!!errors.received}
            registration={form.register('received', {
              validate: (value) => {
                const digits = digitsOnly(value);
                if (!/^\d+$/.test(digits)) return t('sales.sheet.receivedInvalid');
                return Number(digits) <= total || t('sales.sheet.receivedTooHigh');
              },
            })}
          />
        )}
      </FormField>

      <div
        role="status"
        className="flex items-baseline justify-between gap-4 rounded-lg bg-tile px-4 py-3"
      >
        <span className="text-sm text-muted-foreground">{t('sales.sheet.total')}</span>
        <span className="text-xl font-bold tabular-nums">{formatAmount(total)}</span>
      </div>

      {saleRefusal.message && (
        <p role="alert" className="text-sm text-destructive">
          {t('common.saveFailedPrefix')} {saleRefusal.message}
        </p>
      )}
      {paymentFailure && (
        <p role="alert" className="text-sm text-destructive">
          {t('sales.sheet.paymentFailed')} {paymentFailure.message}{' '}
          <Link
            to={`/ventes/${paymentFailure.saleId}`}
            className="font-medium underline underline-offset-4"
          >
            {t('sales.sheet.openSale')}
          </Link>
        </p>
      )}

      <SheetFooter className="grid grid-cols-2 gap-3 px-0 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetClose asChild>
          <Button type="button" variant="outline">
            {paymentFailure ? t('common.close') : t('common.cancel')}
          </Button>
        </SheetClose>
        <Button type="submit" disabled={busy || paymentFailure !== null}>
          {t('common.save')}
        </Button>
      </SheetFooter>
    </form>
  );
}
