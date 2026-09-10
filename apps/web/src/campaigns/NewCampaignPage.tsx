import type { CSSProperties } from 'react';
import { type FieldError, type UseFormRegisterReturn, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client.js';
import { type NewCampaign, useCreateCampaign } from './useCampaigns.js';

/** Only the shape is checked here; the API owns every rule beyond a required, well-formed value. */
const wholeNumber = (value: number) =>
  (Number.isInteger(value) && value >= 0) || 'Un nombre entier positif est attendu.';

export function NewCampaignPage() {
  const create = useCreateCampaign();
  const navigate = useNavigate();
  const form = useForm<NewCampaign>({
    defaultValues: { year: new Date().getFullYear(), startedOn: '' },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: (campaign) => navigate(`/campagnes/${campaign.id}`) }),
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '24rem' }}>
      <h1>Nouvelle campagne</h1>
      <form onSubmit={submit} noValidate>
        <Field
          label="Année"
          error={errors.year}
          input={form.register('year', {
            valueAsNumber: true,
            validate: (value) =>
              (Number.isInteger(value) && value >= 2000 && value <= 2100) ||
              'Une année entre 2000 et 2100 est attendue.',
          })}
          inputMode="numeric"
        />
        <Field
          label="Date de début"
          error={errors.startedOn}
          input={form.register('startedOn', { required: 'La date de début est requise.' })}
          type="date"
        />
        <Field
          label="Moulage (Ar la brique)"
          error={errors.mouldingRate}
          input={form.register('mouldingRate', { valueAsNumber: true, validate: wholeNumber })}
          inputMode="numeric"
        />
        <Field
          label="Transport (Ar la brique)"
          error={errors.transportRate}
          input={form.register('transportRate', { valueAsNumber: true, validate: wholeNumber })}
          inputMode="numeric"
        />
        <Field
          label="Enfournement (Ar la brique)"
          error={errors.kilnLoadingRate}
          input={form.register('kilnLoadingRate', { valueAsNumber: true, validate: wholeNumber })}
          inputMode="numeric"
        />
        {create.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            {createErrorMessage(create.error, form.getValues('year'))}
          </p>
        )}
        <p style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={create.isPending}>
            Créer la campagne
          </button>
          <Link to="/campagnes">Annuler</Link>
        </p>
      </form>
    </main>
  );
}

/** The year is unique per campaign: a 409 names it. Anything else shows the API message. */
function createErrorMessage(error: Error, year: number): string {
  if (error instanceof ApiError && error.status === 409) {
    return `Une campagne existe déjà pour ${year}.`;
  }
  return `Création impossible : ${error.message}`;
}

interface FieldProps {
  label: string;
  input: UseFormRegisterReturn;
  error: FieldError | undefined;
  type?: string;
  inputMode?: 'numeric';
}

const inputStyle: CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box' };

function Field({ label, input, error, type = 'text', inputMode }: FieldProps) {
  return (
    <label style={{ display: 'block', marginBottom: '0.75rem' }}>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        aria-invalid={!!error}
        style={inputStyle}
        {...input}
      />
      {error && (
        <span role="alert" style={{ display: 'block', color: 'var(--error)' }}>
          {error.message}
        </span>
      )}
    </label>
  );
}
