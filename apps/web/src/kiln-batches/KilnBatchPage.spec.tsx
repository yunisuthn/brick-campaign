import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { KilnBatchPage } from './KilnBatchPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};
const batch = {
  id: 'b1',
  campaignId: 'c1',
  loadedOn: '2026-06-01',
  unloadedOn: null,
  quantity: 40000,
  cost: { expenses: 320000, labour: null, total: null },
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <KilnBatchPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/lots', element: <p>Liste des lots</p> },
  { path: '/lots/:id', element: <Page /> },
];

const campaignHandler = http.get('/api/campaigns', () => HttpResponse.json([campaign]));

describe('KilnBatchPage', () => {
  it('shows the cost with an unknown labour, and unloads the batch by dating it', async () => {
    let body: unknown;
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/kiln-batches/b1', () => HttpResponse.json(batch)),
      http.patch('/api/campaigns/c1/kiln-batches/b1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...batch, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/b1');

    expect(await screen.findByRole('heading', { name: /encore au four/ })).toBeInTheDocument();
    const cost = screen.getByRole('region', { name: 'Coût du lot' });
    expect(within(cost).getAllByText('Tarif à fixer')).toHaveLength(2);

    await user.type(screen.getByLabelText('Date de défournement'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByRole('heading', { name: /défourné le 20 juin 2026/ }),
    ).toBeInTheDocument();
    expect(body).toEqual({ loadedOn: '2026-06-01', unloadedOn: '2026-06-20', quantity: 40000 });
  });

  it('refuses a corrected quantity under the minimum without calling the API', async () => {
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/kiln-batches/b1', () => HttpResponse.json(batch)),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/b1');

    const quantity = await screen.findByLabelText('Quantité (briques)');
    await user.clear(quantity);
    await user.type(quantity, '100');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un lot est de 40 000 briques au minimum.',
    );
  });

  it('says the works must go first when the API refuses the cancellation', async () => {
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/kiln-batches/b1', () => HttpResponse.json(batch)),
      http.delete('/api/campaigns/c1/kiln-batches/b1', () =>
        HttpResponse.json(
          { message: 'Kiln batch b1 still has 2 contractor work(s)' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/b1');

    await user.click(await screen.findByRole('button', { name: 'Annuler le lot' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le lot porte encore des prestations : annulez-les d’abord.',
    );
  });

  it('cancels an empty batch and goes back to the list', async () => {
    let cancelled = false;
    server.use(
      campaignHandler,
      http.get('/api/campaigns/c1/kiln-batches/b1', () => HttpResponse.json(batch)),
      http.delete('/api/campaigns/c1/kiln-batches/b1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/lots/b1');

    await user.click(await screen.findByRole('button', { name: 'Annuler le lot' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Liste des lots')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/lots');
    expect(cancelled).toBe(true);
  });
});
