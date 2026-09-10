import type { FieldErrors, UseFormRegister } from 'react-hook-form';
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

export const RATE_LABELS: Record<keyof CampaignRates, string> = {
  mouldingRate: 'Moulage (Ar la brique)',
  transportRate: 'Transport (Ar la brique)',
  kilnLoadingRate: 'Enfournement (Ar la brique)',
};

interface RateFieldsProps<T extends CampaignRates> {
  register: UseFormRegister<T>;
  errors: FieldErrors<CampaignRates>;
}

/** The three rates of a season, shared by the creation form and the rates edit on the page. */
export function RateFields<T extends CampaignRates>({ register, errors }: RateFieldsProps<T>) {
  const rates = register as unknown as UseFormRegister<CampaignRates>;
  return (
    <>
      {(Object.keys(RATE_LABELS) as (keyof CampaignRates)[]).map((name) => (
        <Field
          key={name}
          label={RATE_LABELS[name]}
          error={errors[name]}
          input={rates(name, rateOptions)}
          inputMode="numeric"
        />
      ))}
    </>
  );
}
