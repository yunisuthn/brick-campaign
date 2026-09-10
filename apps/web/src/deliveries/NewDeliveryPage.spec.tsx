import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewDeliveryPage } from './NewDeliveryPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <NewDeliveryPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/ventes/:id', element: <p>Fiche de la vente</p> },
  { path: '/ventes/:id/livraisons/nouvelle', element: <Page /> },
];

function handlers(fired: number) {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/campaigns/c1/stock', () =>
      HttpResponse.json({
        campaignId: 'c1',
        produced: 100000,
        loaded: 80000,
        unloaded: 80000,
        delivered: 80000 - fired,
        raw: 20000,
        inKiln: 0,
        fired,
      }),
    ),
  ];
}

describe('NewDeliveryPage', () => {
  it('tells the fired stock and records the trip, then goes back to the sale', async () => {
    let body: unknown;
    server.use(
      ...handlers(35000),
      http.post('/api/campaigns/c1/sales/s1/deliveries', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 'd1', saleId: 's1', ...(body as object) }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/ventes/s1/livraisons/nouvelle');

    expect(await screen.findByText('Stock cuite : 35 000 briques.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Quantité (briques)'), '2500');
    await user.type(screen.getByLabelText('Coût du voyage (Ar)'), '60000');
    await user.type(screen.getByLabelText('Immatriculation (facultatif)'), ' 1234 TBA ');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le voyage' }));

    expect(await screen.findByText('Fiche de la vente')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ventes/s1');
    expect(body).toEqual({
      date: today(),
      quantity: 2500,
      cost: 60000,
      plate: '1234 TBA',
    });
  });

  it('accepts a trip that cost nothing but requires a quantity', async () => {
    server.use(...handlers(35000));
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/livraisons/nouvelle');

    await user.type(await screen.findByLabelText('Coût du voyage (Ar)'), '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le voyage' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Un nombre entier de briques est attendu.',
    ]);
  });

  it('shows the API refusal when the fired stock does not cover the trip', async () => {
    server.use(
      ...handlers(1000),
      http.post('/api/campaigns/c1/sales/s1/deliveries', () =>
        HttpResponse.json(
          { message: 'Only 1000 fired bricks in stock, cannot deliver 2500' },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/livraisons/nouvelle');

    await user.type(await screen.findByLabelText('Quantité (briques)'), '2500');
    await user.type(screen.getByLabelText('Coût du voyage (Ar)'), '60000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le voyage' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only 1000 fired bricks in stock, cannot deliver 2500',
    );
  });
});
