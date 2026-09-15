import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { NewPaymentPage } from './NewPaymentPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <NewPaymentPage />
    </CurrentCampaignProvider>,
  );
}

function referenceHandlers() {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/moulders', () =>
      HttpResponse.json([
        { id: 'm1', name: 'Rakoto', memberCount: 3, active: true },
        { id: 'm2', name: 'Rasoa', memberCount: 1, active: true },
      ]),
    ),
    http.get('/api/campaigns/c1/balances/contractors', () =>
      HttpResponse.json([
        {
          contractorName: 'Solo',
          bricksByType: { transport: 40000, kiln_loading: 0 },
          earned: 200000,
          paid: 0,
          paidByType: { vatsy: 0, advance: 0, settlement: 0 },
          due: 200000,
        },
      ]),
    ),
  ];
}

describe('NewPaymentPage', () => {
  it('pays one moulder after another, keeping the date and the type', async () => {
    const bodies: unknown[] = [];
    server.use(
      ...referenceHandlers(),
      http.post('/api/campaigns/c1/payments', async ({ request }) => {
        const body = (await request.json()) as object;
        bodies.push(body);
        return HttpResponse.json(
          { id: `v${bodies.length}`, campaignId: 'c1', contractorName: null, ...body },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    mount();

    expect(await screen.findByLabelText('Date')).toHaveValue(today());
    await user.clear(screen.getByLabelText('Date'));
    await user.type(screen.getByLabelText('Date'), '2026-06-05');
    await user.selectOptions(screen.getByLabelText('Mouleur'), 'm1');
    await user.type(screen.getByLabelText('Montant (Ar)'), '50000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Enregistré : Rakoto, 50');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-06-05');
    expect(screen.getByLabelText('Mouleur')).toHaveValue('');
    expect(screen.getByLabelText('Montant (Ar)')).toHaveValue('');

    await user.selectOptions(screen.getByLabelText('Mouleur'), 'm2');
    await user.type(screen.getByLabelText('Montant (Ar)'), '40000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Rasoa/));
    expect(bodies).toEqual([
      { date: '2026-06-05', type: 'vatsy', amount: 50000, moulderId: 'm1' },
      { date: '2026-06-05', type: 'vatsy', amount: 40000, moulderId: 'm2' },
    ]);
  });

  it('pays a contractor by name, suggesting the ones already known', async () => {
    let body: unknown;
    server.use(
      ...referenceHandlers(),
      http.post('/api/campaigns/c1/payments', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          id: 'v1',
          campaignId: 'c1',
          moulderId: null,
          ...(body as object),
        });
      }),
    );
    const user = userEvent.setup();
    mount();

    await user.selectOptions(await screen.findByLabelText('Bénéficiaire'), 'contractor');
    const name = screen.getByLabelText('Nom du prestataire');
    expect(screen.queryByLabelText('Mouleur')).not.toBeInTheDocument();
    // The known names are offered as a datalist, which has no accessible surface of its own.
    const list = document.getElementById(name.getAttribute('list') ?? '');
    expect([...(list?.querySelectorAll('option') ?? [])].map((o) => o.value)).toEqual(['Solo']);

    await user.type(name, ' Solo ');
    await user.selectOptions(screen.getByLabelText('Type'), 'advance');
    await user.type(screen.getByLabelText('Montant (Ar)'), '120000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Enregistré : Solo');
    expect(body).toEqual({
      date: today(),
      type: 'advance',
      amount: 120000,
      contractorName: 'Solo',
    });
  });

  it('requires the beneficiary the kind names, and a whole positive amount', async () => {
    server.use(...referenceHandlers());
    const user = userEvent.setup();
    mount();

    await user.type(await screen.findByLabelText('Montant (Ar)'), '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    let alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le mouleur est requis.',
      'Un montant entier en ariary est attendu.',
    ]);

    await user.selectOptions(screen.getByLabelText('Bénéficiaire'), 'contractor');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le nom du prestataire est requis.',
      'Un montant entier en ariary est attendu.',
    ]);
  });
});
