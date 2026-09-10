import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewSalePage } from './NewSalePage.js';

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
      <NewSalePage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/ventes/nouvelle', element: <Page /> },
  { path: '/ventes/:id', element: <p>Fiche de la vente</p> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/clients', () =>
    HttpResponse.json([{ id: 'cl1', name: 'Rabe', phone: null, locality: 'Antsirabe' }]),
  ),
];

describe('NewSalePage', () => {
  it('shows the total as it is typed and opens the sale once recorded', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/sales', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: 's1',
            campaignId: 'c1',
            payment: null,
            deliveredQuantity: 0,
            total: 1250000,
            status: 'ordered',
            ...(body as object),
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/ventes/nouvelle');

    await user.selectOptions(await screen.findByLabelText('Client'), 'cl1');
    await user.type(screen.getByLabelText('Quantité commandée (briques)'), '5000');
    await user.type(screen.getByLabelText('Prix unitaire (Ar la brique)'), '250');
    expect(screen.getByRole('status')).toHaveTextContent('Total : 1 250 000 Ar');

    await user.click(screen.getByRole('button', { name: 'Enregistrer la vente' }));

    expect(await screen.findByText('Fiche de la vente')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ventes/s1');
    expect(body).toEqual({
      clientId: 'cl1',
      date: today(),
      orderedQuantity: 5000,
      unitPrice: 250,
    });
  });

  it('requires a client, a quantity and a price', async () => {
    server.use(...baseHandlers);
    const user = userEvent.setup();
    renderRoutes(routes, '/ventes/nouvelle');

    await user.click(await screen.findByRole('button', { name: 'Enregistrer la vente' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le client est requis.',
      'Un nombre entier de briques est attendu.',
      'Un prix entier en ariary est attendu.',
    ]);
  });
});
