import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { apiErrorMessage } from '../api/errorMessages.js';
import { Field } from '../form/Field.js';
import { RateFields } from './rateFields.js';
import { type NewCampaign, useCreateCampaign } from './useCampaigns.js';

export function NewCampaignPage() {
  const create = useCreateCampaign();
  const navigate = useNavigate();
  const form = useForm<NewCampaign>({
    defaultValues: {
      year: new Date().getFullYear(),
      startedOn: '',
      mouldingRate: null,
      transportRate: null,
      kilnLoadingRate: null,
    },
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
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>
          Un tarif encore en discussion se laisse vide ; il se fixe ensuite depuis la fiche.
        </p>
        <RateFields register={form.register} errors={errors} />
        {create.isError && (
          <p role="alert" style={{ color: 'var(--error)' }}>
            Création impossible : {apiErrorMessage(create.error)}
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
