import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewSalePaymentPage } from './NewSalePaymentPage.js';
import { SalePaymentPage } from './SalePaymentPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  tranche: 1,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};

// 5 000 bricks at 250 Ar, 400 000 Ar already in: 850 000 Ar left to take.
const sale = {
  id: 's1',
  campaignId: 'c1',
  clientId: 'cl1',
  date: '2026-08-01',
  orderedQuantity: 5000,
  unitPrice: 250,
  deliveredQuantity: 5000,
  receivedAmount: 400000,
  total: 1250000,
  outstanding: 850000,
  status: 'partially_paid' as const,
};
const payment = { id: 'p1', saleId: 's1', date: '2026-08-05', amount: 400000 };

const routes = [
  { path: '/ventes/:id', element: <p>Fiche de la vente</p> },
  {
    path: '/ventes/:id/encaissements/nouveau',
    element: (
      <CurrentCampaignProvider>
        <NewSalePaymentPage />
      </CurrentCampaignProvider>
    ),
  },
  {
    path: '/ventes/:id/encaissements/:paymentId',
    element: (
      <CurrentCampaignProvider>
        <SalePaymentPage />
      </CurrentCampaignProvider>
    ),
  },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(sale)),
];

describe('NewSalePaymentPage', () => {
  it('says what is left, records the instalment and goes back to the sale', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/sales/s1/payments', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...payment, id: 'p2', date: '2026-08-20', amount: 850000 });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/encaissements/nouveau');

    // findByRole('status') would catch the loading line first; the text is what is waited for.
    expect(await screen.findByText('Reste à encaisser : 850 000 Ar.')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Date'));
    await user.type(screen.getByLabelText('Date'), '20/08/2026');
    await user.type(screen.getByLabelText('Montant reçu (Ar)'), '850000');
    await user.click(screen.getByRole('button', { name: 'Encaisser' }));

    expect(await screen.findByText('Fiche de la vente')).toBeInTheDocument();
    expect(body).toEqual({ date: '2026-08-20', amount: 850000 });
  });

  it('says in French that the instalment goes past what is left', async () => {
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/sales/s1/payments', () =>
        HttpResponse.json(
          {
            code: 'sale_overpaid',
            message: 'Only 850000 left to pay, cannot receive 900000',
            details: { remaining: 850000, amount: 900000 },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/encaissements/nouveau');

    await user.type(await screen.findByLabelText('Montant reçu (Ar)'), '900000');
    await user.click(screen.getByRole('button', { name: 'Encaisser' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Encaissement impossible : Il ne reste que 850 000 Ar à encaisser sur cette vente.',
    );
  });
});

describe('SalePaymentPage', () => {
  const withPayment = [
    ...baseHandlers,
    http.get('/api/campaigns/c1/sales/s1/payments/p1', () => HttpResponse.json(payment)),
  ];

  it('names the ceiling this instalment can be raised to, and corrects it', async () => {
    let body: unknown;
    server.use(
      ...withPayment,
      http.patch('/api/campaigns/c1/sales/s1/payments/p1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...payment, amount: 500000 });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/encaissements/p1');

    // 850 000 still owed plus the 400 000 of this instalment.
    expect(
      await screen.findByText('Cet encaissement peut aller jusqu’à 1 250 000 Ar.'),
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Montant reçu (Ar)'));
    await user.type(screen.getByLabelText('Montant reçu (Ar)'), '500000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(body).toEqual({ date: '2026-08-05', amount: 500000 });
  });

  it('cancels the instalment and goes back to the sale', async () => {
    server.use(
      ...withPayment,
      http.delete(
        '/api/campaigns/c1/sales/s1/payments/p1',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/encaissements/p1');

    await user.click(await screen.findByRole('button', { name: 'Annuler l’encaissement' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Fiche de la vente')).toBeInTheDocument();
  });

  it('says the instalment is not found on a 404', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1/payments/nope', () =>
        HttpResponse.json(
          { code: 'sale_payment_not_found', message: 'Sale payment nope not found' },
          { status: 404 },
        ),
      ),
    );
    renderRoutes(routes, '/ventes/s1/encaissements/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Encaissement introuvable.');
  });
});
