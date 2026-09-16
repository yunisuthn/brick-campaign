import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { isoToFrench } from '../form/dateMask.js';
import { today } from '../format.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { NewProductionPage } from './NewProductionPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40, 55],
  transportRates: [10],
  kilnLoadingRate: 5,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <NewProductionPage />
    </CurrentCampaignProvider>,
  );
}

function referenceHandlers() {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/moulders', ({ request }) => {
      expect(new URL(request.url).searchParams.get('includeInactive')).toBe('false');
      return HttpResponse.json([
        { id: 'm1', name: 'Rakoto', memberCount: 3, active: true },
        { id: 'm2', name: 'Rasoa', memberCount: 1, active: true },
      ]);
    }),
    http.get('/api/rice-fields', () =>
      HttpResponse.json([
        { id: 'r1', name: 'Ambany', location: 'Sud', surfaceM2: null, contractType: 'durable' },
      ]),
    ),
  ];
}

describe('NewProductionPage', () => {
  it('saves one entry after another, keeping the date and the rice field', async () => {
    const bodies: unknown[] = [];
    server.use(
      ...referenceHandlers(),
      http.post('/api/campaigns/c1/productions', async ({ request }) => {
        const body = (await request.json()) as object;
        bodies.push(body);
        return HttpResponse.json(
          { id: `p${bodies.length}`, campaignId: 'c1', ...body },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    mount();

    const date = await screen.findByLabelText('Date de début');
    expect(date).toHaveValue(isoToFrench(today()));
    await user.clear(date);
    await user.type(date, '02/06/2026');
    await user.selectOptions(screen.getByLabelText('Mouleur'), 'm1');
    await user.selectOptions(screen.getByLabelText('Rizière'), 'r1');
    await user.type(screen.getByLabelText('Quantité (briques)'), '1200');
    await user.selectOptions(screen.getByLabelText('Tarif de moulage'), '40');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Enregistré : Rakoto, 1 200 briques.',
    );
    expect(screen.getByLabelText('Date de début')).toHaveValue('02/06/2026');
    expect(screen.getByLabelText('Rizière')).toHaveValue('r1');
    expect(screen.getByLabelText('Mouleur')).toHaveValue('');
    expect(screen.getByLabelText('Quantité (briques)')).toHaveValue('');
    expect(screen.getByLabelText('Tarif de moulage')).toHaveValue('40');

    await user.selectOptions(screen.getByLabelText('Mouleur'), 'm2');
    await user.type(screen.getByLabelText('Quantité (briques)'), '800');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Enregistré : Rasoa, 800 briques.')).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        startedOn: '2026-06-02',
        endedOn: null,
        moulderId: 'm1',
        riceFieldId: 'r1',
        quantity: 1200,
        rate: 40,
      },
      {
        startedOn: '2026-06-02',
        endedOn: null,
        moulderId: 'm2',
        riceFieldId: 'r1',
        quantity: 800,
        rate: 40,
      },
    ]);
  });

  it('requires a moulder, a rice field and a whole positive quantity', async () => {
    server.use(...referenceHandlers());
    const user = userEvent.setup();
    mount();

    await user.type(await screen.findByLabelText('Quantité (briques)'), '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le mouleur est requis.',
      'La rizière est requise.',
      'Un nombre entier de briques est attendu.',
    ]);
  });

  it('puts a value the API refuses under the field it names', async () => {
    server.use(
      ...referenceHandlers(),
      http.post('/api/campaigns/c1/productions', () =>
        HttpResponse.json(
          {
            code: 'validation_failed',
            message: 'Validation failed',
            issues: [
              {
                path: 'quantity',
                message: 'Too small: expected number to be >0',
                kind: 'too_small',
                origin: 'int',
                limit: 0,
                inclusive: false,
              },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    mount();

    await user.selectOptions(await screen.findByLabelText('Mouleur'), 'm1');
    await user.selectOptions(screen.getByLabelText('Rizière'), 'r1');
    await user.type(screen.getByLabelText('Quantité (briques)'), '500');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Au moins 1.');
    expect(screen.queryByText(/Enregistrement impossible/)).not.toBeInTheDocument();
  });

  it('says above the form what no field can carry', async () => {
    server.use(
      ...referenceHandlers(),
      http.post('/api/campaigns/c1/productions', () =>
        HttpResponse.json(
          {
            code: 'validation_failed',
            message: 'Validation failed',
            issues: [{ path: '', message: 'At least one field is required', kind: 'other' }],
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    mount();

    await user.selectOptions(await screen.findByLabelText('Mouleur'), 'm1');
    await user.selectOptions(screen.getByLabelText('Rizière'), 'r1');
    await user.type(screen.getByLabelText('Quantité (briques)'), '500');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enregistrement impossible : La saisie est incomplète ou mal formée.',
    );
  });
});
