import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { ProductionPage } from './ProductionPage.js';

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
const entry = {
  id: 'p1',
  campaignId: 'c1',
  moulderId: 'gone',
  riceFieldId: 'r1',
  startedOn: '2026-06-02',
  endedOn: null,
  quantity: 1200,
  rate: 40,
};

const routes = [
  { path: '/productions', element: <p>Liste des productions</p> },
  {
    path: '/productions/:id',
    element: (
      <CurrentCampaignProvider>
        <ProductionPage />
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
    http.get('/api/rice-fields', () =>
      HttpResponse.json([
        { id: 'r1', name: 'Ambany', location: 'Sud', surfaceM2: null, contractType: 'durable' },
      ]),
    ),
  ];
}

describe('ProductionPage', () => {
  it('corrects an entry, offering its own moulder even retired but no other retired one', async () => {
    let body: unknown;
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/productions/p1', () => HttpResponse.json(entry)),
      http.patch('/api/campaigns/c1/productions/p1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...entry, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/productions/p1');

    expect(await screen.findByRole('heading', { name: /Parti, 2 juin 2026/ })).toBeInTheDocument();
    const moulder = screen.getByLabelText('Mouleur');
    expect(moulder).toHaveTextContent('Parti');
    await user.click(moulder);
    expect(screen.getByRole('option', { name: 'Parti' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Autre retiré' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Parti' }));

    const quantity = screen.getByLabelText('Quantité (briques)');
    await user.clear(quantity);
    await user.type(quantity, '1300');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('1 300 briques')).toBeInTheDocument();
    expect(body).toEqual({
      startedOn: '2026-06-02',
      endedOn: null,
      moulderId: 'gone',
      riceFieldId: 'r1',
      quantity: 1300,
      rate: 40,
    });
  });

  it('lets the end date be fixed once the work is finished', async () => {
    let body: unknown;
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/productions/p1', () => HttpResponse.json(entry)),
      http.patch('/api/campaigns/c1/productions/p1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...entry, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/productions/p1');

    const end = await screen.findByLabelText('Date de fin');
    expect(end).toHaveValue('');
    await user.type(end, '03/06/2026');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByRole('heading', { name: /2 juin 2026 – 3 juin 2026/ }),
    ).toBeInTheDocument();
    expect(body).toMatchObject({ endedOn: '2026-06-03' });
  });

  it('cancels an entry after a confirmation and goes back to the list', async () => {
    let cancelled = false;
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/productions/p1', () => HttpResponse.json(entry)),
      http.delete('/api/campaigns/c1/productions/p1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/productions/p1');

    await user.click(await screen.findByRole('button', { name: 'Annuler la saisie' }));
    expect(cancelled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Garder la saisie' }));
    expect(screen.getByRole('button', { name: 'Annuler la saisie' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Annuler la saisie' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Liste des productions')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/productions');
    expect(cancelled).toBe(true);
  });

  it('says the entry is not found on a 404, as after a cancellation', async () => {
    server.use(
      ...referenceHandlers(),
      http.get('/api/campaigns/c1/productions/nope', () =>
        HttpResponse.json({ message: 'Production nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/productions/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Saisie introuvable.');
  });
});
