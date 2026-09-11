import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Field } from '../form/Field.js';
import { apiFormErrors } from '../form/apiFormErrors.js';
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

  const createRefusal = apiFormErrors(create, form);

  const submit = form.handleSubmit((input) =>
    create.mutate(input, { onSuccess: (campaign) => navigate(`/campagnes/${campaign.id}`) }),
  );

  return (
    <main className="page">
      <h1>Nouvelle campagne</h1>
      <form onSubmit={submit} noValidate>
        <Field
          label="Année"
          error={errors.year ?? createRefusal.fields.year}
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
          error={errors.startedOn ?? createRefusal.fields.startedOn}
          input={form.register('startedOn', { required: 'La date de début est requise.' })}
          type="date"
        />
        <p className="sub">
          Un tarif encore en discussion se laisse vide ; il se fixe ensuite depuis la fiche.
        </p>
        <RateFields register={form.register} errors={{ ...errors, ...createRefusal.fields }} />
        {createRefusal.message && <p role="alert">Création impossible : {createRefusal.message}</p>}
        <p className="actions">
          <button type="submit" disabled={create.isPending}>
            Créer la campagne
          </button>
          <Link to="/campagnes">Annuler</Link>
        </p>
      </form>
    </main>
  );
}
