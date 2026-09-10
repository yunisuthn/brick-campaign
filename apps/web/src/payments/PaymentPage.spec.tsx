import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { PaymentPage } from './PaymentPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};
const payment = {
  id: 'v1',
  campaignId: 'c1',
  moulderId: 'gone',
  contractorName: null,
  type: 'vatsy' as const,
  date: '2026-06-05',
  amount: 50000,
};

const routes = [
  { path: '/versements', element: <p>Liste des versements</p> },
  {
    path: '/versements/:id',
    element: (
      <CurrentCampaignProvider>
        <PaymentPage />
      </CurrentCampaignProvider>
    ),
  },
];

function referenceHandlers() {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/moulders', () =>
      HttpResponse.json([
        { id: 'm1', name: 'Rakoto', memberCount: 3, active: true },
        { id: 'gone', name: 'Parti', memberCount: 1, active: false },
        { id: 'other', name: 'Autre retiré', memberCount: 1, active: false },
      ]),
    ),
    http.get('/api/campaigns/c1/balances/contractors', () => HttpResponse.json([])),
  ];
}

describe('PaymentPage', () => {
  it('turns a payment to a moulder into one to a named contractor', async () => {
    let body: unknown;
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/payments/v1', () => HttpResponse.json(payment)),
      http.patch('/api/campaigns/c1/payments/v1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...payment, moulderId: null, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/versements/v1');

    expect(await screen.findByRole('heading', { name: /Parti, 5 juin 2026/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Mouleur')).toHaveValue('gone');
    expect(screen.queryByRole('option', { name: 'Autre retiré' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Bénéficiaire'), 'contractor');
    await user.type(screen.getByLabelText('Nom du prestataire'), 'Solo');
    await user.selectOptions(screen.getByLabelText('Type'), 'settlement');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('heading', { name: /Solo, 5 juin 2026/ })).toBeInTheDocument();
    expect(body).toEqual({
      date: '2026-06-05',
      type: 'settlement',
      amount: 50000,
      contractorName: 'Solo',
    });
  });

  it('cancels a payment after a confirmation and goes back to the list', async () => {
    let cancelled = false;
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/payments/v1', () => HttpResponse.json(payment)),
      http.delete('/api/campaigns/c1/payments/v1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/versements/v1');

    await user.click(await screen.findByRole('button', { name: 'Annuler le versement' }));
    expect(cancelled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Garder le versement' }));

    await user.click(screen.getByRole('button', { name: 'Annuler le versement' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Liste des versements')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/versements');
    expect(cancelled).toBe(true);
  });

  it('says the payment is not found on a 404, as after a cancellation', async () => {
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/payments/nope', () =>
        HttpResponse.json({ message: 'Payment nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/versements/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Versement introuvable.');
  });
});
