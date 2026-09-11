import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { SalePage } from './SalePage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};
const sale = {
  id: 's1',
  campaignId: 'c1',
  clientId: 'cl1',
  date: '2026-08-01',
  orderedQuantity: 5000,
  unitPrice: 250,
  payment: null,
  deliveredQuantity: 5000,
  total: 1250000,
  status: 'delivered' as const,
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
  http.get('/api/clients', () =>
    HttpResponse.json([
      { id: 'cl1', name: 'Rabe', phone: null, locality: 'Antsirabe' },
      { id: 'cl2', name: 'Vola', phone: null, locality: 'Betafo' },
    ]),
  ),
];

describe('SalePage', () => {
  it('records the payment with the total owed by default, then takes it back', async () => {
    const bodies: unknown[] = [];
    let current = sale;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(current)),
      http.patch('/api/campaigns/c1/sales/s1', async ({ request }) => {
        const body = (await request.json()) as { payment: unknown };
        bodies.push(body);
        current = {
          ...sale,
          payment: body.payment as typeof sale.payment,
          status: body.payment === null ? 'delivered' : ('paid' as never),
        };
        return HttpResponse.json(current);
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1');

    expect(await screen.findByLabelText('Montant encaissé (Ar)')).toHaveValue('1250000');
    await user.click(screen.getByRole('button', { name: 'Encaisser' }));

    expect(await screen.findByText(/1 250 000 Ar reçus le/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reprendre l’encaissement' }));

    expect(await screen.findByRole('button', { name: 'Encaisser' })).toBeInTheDocument();
    expect(bodies).toEqual([
      { payment: { paidOn: today(), amountReceived: 1250000 } },
      { payment: null },
    ]);
  });

  it('corrects the sale without touching its payment', async () => {
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

    await user.selectOptions(await screen.findByLabelText('Client'), 'cl2');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('heading', { name: /Vola/ })).toBeInTheDocument();
    expect(body).toEqual({
      clientId: 'cl2',
      date: '2026-08-01',
      orderedQuantity: 5000,
      unitPrice: 250,
    });
  });

  it('says the deliveries must go first when the API refuses the cancellation', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/sales/s1', () => HttpResponse.json(sale)),
      http.delete('/api/campaigns/c1/sales/s1', () =>
        HttpResponse.json(
          {
            code: 'sale_has_deliveries',
            message: 'Sale s1 still has 2 delivery(ies)',
            details: { deliveries: 2 },
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
      'Annulation impossible : Cette vente porte encore 2 voyages : annulez-les d’abord.',
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
