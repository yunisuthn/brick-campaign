import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { chooseOption } from '../test/select.js';
import { server } from '../test/server.js';
import { SalePage } from './SalePage.js';

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

function Page() {
  return (
    <CurrentCampaignProvider>
      <SalePage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/ventes', element: <p>Liste des ventes</p> },
  { path: '/ventes/:id', element: <Page /> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/campaigns/c1/sales/s1/deliveries', () => HttpResponse.json([])),
  http.get('/api/campaigns/c1/sales/s1/payments', () =>
    HttpResponse.json([{ id: 'p1', saleId: 's1', date: '2026-08-05', amount: 400000 }]),
  ),
  http.get('/api/clients', () =>
    HttpResponse.json([
      { id: 'cl1', name: 'Rabe', phone: null, locality: 'Antsirabe' },
      { id: 'cl2', name: 'Vola', phone: null, locality: 'Betafo' },
    ]),
  ),
];

describe('SalePage', () => {
  it('tells what came in, what is left, and leads to a new instalment', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(sale)),
    );
    renderRoutes(routes, '/ventes/s1');

    expect(await screen.findByRole('heading', { name: /Rabe/ })).toHaveTextContent(
      'Partiellement payée',
    );
    expect(
      screen.getByText(/400 000 Ar reçus sur 1 250 000 Ar, reste 850 000 Ar à encaisser/),
    ).toBeInTheDocument();
    // The accessible name keeps the narrow spaces French puts between thousands.
    expect(await screen.findByRole('link', { name: /400\s000\sAr/ })).toHaveAttribute(
      'href',
      '/ventes/s1/encaissements/p1',
    );
    expect(screen.getByRole('link', { name: 'Encaisser un versement' })).toHaveAttribute(
      'href',
      '/ventes/s1/encaissements/nouveau',
    );
  });

  it('offers no new instalment once the sale is paid in full', async () => {
    const paid = { ...sale, receivedAmount: 1250000, outstanding: 0, status: 'paid' as const };
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(paid)),
    );
    renderRoutes(routes, '/ventes/s1');

    expect(await screen.findByText(/1 250 000 Ar reçus sur 1 250 000 Ar\./)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Encaisser un versement' })).not.toBeInTheDocument();
  });

  it('corrects the sale without touching what came in', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(sale)),
      http.patch('/api/campaigns/c1/sales/s1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...sale, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1');

    await screen.findByLabelText('Client');
    await chooseOption(user, 'Client', 'Vola');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('heading', { name: /Vola/ })).toBeInTheDocument();
    expect(body).toEqual({
      clientId: 'cl2',
      date: '2026-08-01',
      orderedQuantity: 5000,
      unitPrice: 250,
    });
  });

  it('says the instalments must go first when the API refuses the cancellation', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(sale)),
      http.delete('/api/campaigns/c1/sales/s1', () =>
        HttpResponse.json(
          {
            code: 'sale_has_payments',
            message: 'Sale s1 still has 1 payment(s)',
            details: { payments: 1 },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1');

    await user.click(await screen.findByRole('button', { name: 'Annuler la vente' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Annulation impossible : Cette vente porte encore 1 encaissement : annulez-la d’abord.',
    );
  });

  it('says the sale is not found on a 404', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/nope', () =>
        HttpResponse.json({ message: 'Sale nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/ventes/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Vente introuvable.');
  });
});
