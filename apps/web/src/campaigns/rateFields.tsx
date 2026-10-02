import { useState } from 'react';
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormReturn,
  useFieldArray,
} from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { NumberField } from '@/components/fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { digitsOnly } from '../format.js';
import { useTranslation } from '../i18n/I18nProvider.js';
import type { TranslationKey } from '../i18n/translations.js';
import type { CampaignRates } from './useCampaigns.js';

/**
 * A rate left empty is null: to be fixed once negotiated (reference document, section 3).
 * Only the shape is checked here; the API owns every rule beyond that.
 */
function rateOptions(t: ReturnType<typeof useTranslation>['t']) {
  return {
    setValueAs: (value: unknown) =>
      value === '' || value === null ? null : Number(digitsOnly(value as string)),
    validate: (value: number | null) =>
      value === null || (Number.isInteger(value) && value >= 0) || t('campaigns.rates.invalidRate'),
  };
}

const PRICE_LIST_LABEL_KEY: Record<'mouldingRates' | 'transportRates', TranslationKey> = {
  mouldingRates: 'campaigns.mouldingLabel',
  transportRates: 'campaigns.transportLabel',
};

interface PriceListFieldProps<T extends CampaignRates> {
  form: UseFormReturn<T>;
  name: keyof typeof PRICE_LIST_LABEL_KEY;
}

/**
 * A list of prices (Ar la brique), one of which is picked per entry: rice fields worked over a
 * season are not all the same distance away, so moulding and transport can each take more than
 * one price.
 */
function PriceListField<T extends CampaignRates>({ form, name }: PriceListFieldProps<T>) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: name as never,
  });
  const [draft, setDraft] = useState('');
  const { t } = useTranslation();
  const label = t(PRICE_LIST_LABEL_KEY[name]);

  const add = () => {
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 0) return;
    append(value as never);
    setDraft('');
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">
        {label} {t('campaigns.rates.priceListUnit')}
      </legend>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">{t('campaigns.rates.noneYet')}</p>
      )}
      {fields.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {fields.map((field, index) => (
            <li
              key={field.id}
              className="flex h-9 items-center gap-0.5 rounded-full bg-tile pl-3 font-semibold tabular-nums"
            >
              {form.watch(`${name}.${index}` as never) as unknown as number}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground"
                onClick={() => remove(index)}
              >
                <X aria-hidden="true" />
                <span className="sr-only">{t('campaigns.rates.remove')}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={t('campaigns.rates.newPriceLabel', { list: label.toLowerCase() })}
          placeholder={t('campaigns.rates.newPriceLabel', { list: label.toLowerCase() })}
          className="grow"
        />
        <Button type="button" variant="outline" onClick={add} disabled={draft === ''}>
          <Plus aria-hidden="true" />
          {t('campaigns.rates.add')}
        </Button>
      </div>
    </fieldset>
  );
}

interface RateFieldsProps<T extends CampaignRates> {
  form: UseFormReturn<T>;
  errors: FieldErrors<CampaignRates>;
}

/** The season's prices, shared by the creation form and the rates edit on the page. */
export function RateFields<T extends CampaignRates>({ form, errors }: RateFieldsProps<T>) {
  const register = form.register as unknown as UseFormRegister<CampaignRates>;
  const { t } = useTranslation();
  return (
    <>
      <PriceListField form={form} name="mouldingRates" />
      <Separator />
      <PriceListField form={form} name="transportRates" />
      <Separator />
      <NumberField
        label={t('campaigns.rates.kilnLoadingFieldLabel')}
        error={errors.kilnLoadingRate}
        registration={register('kilnLoadingRate', rateOptions(t))}
      />
    </>
  );
}
