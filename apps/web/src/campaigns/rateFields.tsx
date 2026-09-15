import { useState } from 'react';
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormReturn,
  useFieldArray,
} from 'react-hook-form';
import { Field } from '../form/Field.js';
import type { CampaignRates } from './useCampaigns.js';

/**
 * A rate left empty is null: to be fixed once negotiated (reference document, section 3).
 * Only the shape is checked here; the API owns every rule beyond that.
 */
const rateOptions = {
  setValueAs: (value: unknown) => (value === '' || value === null ? null : Number(value)),
  validate: (value: number | null) =>
    value === null ||
    (Number.isInteger(value) && value >= 0) ||
    'Un nombre entier positif est attendu, ou rien tant que le tarif n’est pas fixé.',
};

const PRICE_LIST_LABELS = {
  mouldingRates: 'Moulage',
  transportRates: 'Transport',
} as const;

interface PriceListFieldProps<T extends CampaignRates> {
  form: UseFormReturn<T>;
  name: keyof typeof PRICE_LIST_LABELS;
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

  const add = () => {
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 0) return;
    append(value as never);
    setDraft('');
  };

  return (
    <fieldset>
      <legend>{PRICE_LIST_LABELS[name]} (Ar la brique)</legend>
      {fields.length === 0 && <p className="sub">Aucun prix fixé pour l’instant.</p>}
      <ul className="price-list">
        {fields.map((field, index) => (
          <li key={field.id}>
            {form.watch(`${name}.${index}` as never) as unknown as number}
            <button type="button" onClick={() => remove(index)}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <p className="inline-form">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`Nouveau prix de ${PRICE_LIST_LABELS[name].toLowerCase()}`}
        />
        <button type="button" onClick={add} disabled={draft === ''}>
          Ajouter
        </button>
      </p>
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
  return (
    <>
      <PriceListField form={form} name="mouldingRates" />
      <PriceListField form={form} name="transportRates" />
      <Field
        label="Enfournement (Ar la brique)"
        error={errors.kilnLoadingRate}
        input={register('kilnLoadingRate', rateOptions)}
        inputMode="numeric"
      />
    </>
  );
}
