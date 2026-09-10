import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { plain } from '../test/text.js';
import { DeliveryPage } from './DeliveryPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};
const delivery = {
  id: 'd1',
  saleId: 's1',
  date: '2026-08-05',
  quantity: 2500,
  cost: 60000,
  plate: '1234 TBA',
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <DeliveryPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/ventes/:id', element: <p>Fiche de la vente</p> },
  { path: '/ventes/:id/livraisons/:deliveryId', element: <Page /> },
];

const campaignHandler = http.get('/api/campaigns', () => HttpResponse.json([campaign]));

describe('DeliveryPage', () => {
  it('corrects the trip and keeps it on its sale', async () => {
    let body: unknown;
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/sales/s1/deliveries/d1', () => HttpResponse.json(delivery)),
      http.patch('/api/campaigns/c1/sales/s1/deliveries/d1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...delivery, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/s1/livraisons/d1');

    const quantity = await screen.findByLabelText('Quantité (briques)');
    expect(quantity).toHaveValue('2500');
    await user.clear(quantity);
    await user.type(quantity, '2400');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByRole('heading', { name: (name) => plain(name).includes('2 400 briques') }),
    ).toBeInTheDocument();
    expect(body).toEqual({ date: '2026-08-05', quantity: 2400, cost: 60000, plate: '1234 TBA' });
  });

  it('cancels the trip after a confirmation and goes back to the sale', async () => {
    let cancelled = false;
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/sales/s1/deliveries/d1', () => HttpResponse.json(delivery)),
      http.delete('/api/campaigns/c1/sales/s1/deliveries/d1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/ventes/s1/livraisons/d1');

    await user.click(await screen.findByRole('button', { name: 'Annuler le voyage' }));
    expect(cancelled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Fiche de la vente')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ventes/s1');
    expect(cancelled).toBe(true);
  });

  it('says the trip is not found on a 404, as after a cancellation', async () => {
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/sales/s1/deliveries/nope', () =>
        HttpResponse.json({ message: 'Delivery nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/ventes/s1/livraisons/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Voyage introuvable.');
  });
});
