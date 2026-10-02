import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { renderWithProviders } from '../test/render.js';
import { chooseOption } from '../test/select.js';
import { ChoiceField, DateField, NumberField, SelectField } from './fields.js';

interface Values {
  date: string;
  quantity: string;
  rate: string;
  kind: string;
}

function Sample({ onSave }: { onSave: (values: Values) => void }) {
  const form = useForm<Values>({
    defaultValues: { date: '', quantity: '', rate: '', kind: 'moulder' },
  });
  const errors = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(onSave)} noValidate>
      <DateField
        label="Date"
        name="date"
        control={form.control}
        error={errors.date}
        required="La date est requise."
      />
      <NumberField
        label="Quantité"
        hint="En briques."
        error={errors.quantity}
        registration={form.register('quantity')}
      />
      <SelectField
        label="Tarif"
        name="rate"
        control={form.control}
        error={errors.rate}
        options={[
          { value: '', label: 'À fixer' },
          { value: '25', label: '25 Ar la brique' },
        ]}
      />
      <ChoiceField
        label="Bénéficiaire"
        name="kind"
        control={form.control}
        error={errors.kind}
        options={[
          { value: 'moulder', label: 'Mouleur' },
          { value: 'contractor', label: 'Prestataire' },
        ]}
      />
      <button type="submit">Enregistrer</button>
    </form>
  );
}

describe('fields', () => {
  it('hands the form an ISO date, plain digits, a listed value and a choice', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Sample onSave={onSave} />);

    await user.type(screen.getByLabelText('Date'), '02102026');
    await user.type(screen.getByLabelText('Quantité'), '1800');
    expect(screen.getByLabelText('Quantité')).toHaveValue('1 800');
    expect(screen.getByLabelText('Quantité')).toHaveAccessibleDescription('En briques.');
    expect(screen.getByLabelText('Tarif')).toHaveTextContent('À fixer');
    await chooseOption(user, 'Tarif', '25 Ar la brique');
    expect(screen.getByRole('radio', { name: 'Mouleur' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Prestataire' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onSave).toHaveBeenCalledWith(
      { date: '2026-10-02', quantity: '1 800', rate: '25', kind: 'contractor' },
      expect.anything(),
    );
  });

  it('shows the error in place of the hint, tied to its field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sample onSave={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La date est requise.');
    expect(screen.getByLabelText('Date')).toHaveAccessibleDescription('La date est requise.');
    expect(screen.getByLabelText('Date')).toBeInvalid();
  });
});
