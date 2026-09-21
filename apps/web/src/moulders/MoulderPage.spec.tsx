import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { MoulderPage } from './MoulderPage.js';

function Page() {
  return (
    <CurrentCampaignProvider>
      <MoulderPage />
    </CurrentCampaignProvider>
  );
}

const routes = [{ path: '/mouleurs/:id', element: <Page /> }];
const rakoto = { id: 'm1', name: 'Rakoto', memberCount: 3, active: true };
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

function baseHandlers() {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/campaigns/c1/balances/moulders', () => HttpResponse.json([])),
  ];
}

describe('MoulderPage', () => {
  it('edits the name and the member count', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers(),
      http.get('/api/moulders/m1', () => HttpResponse.json(rakoto)),
      http.patch('/api/moulders/m1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...rakoto, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/mouleurs/m1');

    const name = await screen.findByLabelText('Nom du responsable');
    expect(name).toHaveValue('Rakoto');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await user.clear(name);
    await user.type(name, 'Rakotobe');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('heading', { name: 'Rakotobe' })).toBeInTheDocument();
    expect(body).toEqual({ name: 'Rakotobe', memberCount: 3 });
  });

  it('retires a moulder and can bring them back', async () => {
    let active = true;
    server.use(
      ...baseHandlers(),
      http.get('/api/moulders/m1', () => HttpResponse.json({ ...rakoto, active })),
      http.patch('/api/moulders/m1', async ({ request }) => {
        const body = (await request.json()) as { active: boolean };
        active = body.active;
        return HttpResponse.json({ ...rakoto, active });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/mouleurs/m1');

    await user.click(await screen.findByRole('button', { name: 'Retirer le mouleur' }));
    expect(await screen.findByRole('button', { name: 'Réactiver le mouleur' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rakoto · retiré');

    await user.click(screen.getByRole('button', { name: 'Réactiver le mouleur' }));
    expect(await screen.findByRole('button', { name: 'Retirer le mouleur' })).toBeInTheDocument();
    expect(active).toBe(true);
  });

  it('says the moulder is not found on a 404', async () => {
    server.use(
      ...baseHandlers(),
      http.get('/api/moulders/nope', () =>
        HttpResponse.json({ message: 'Moulder nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/mouleurs/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Mouleur introuvable.');
  });

  it('shows what the moulder is owed on the current campaign', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/balances/moulders', () =>
        HttpResponse.json([
          {
            moulderId: 'm1',
            name: 'Rakoto',
            bricks: 2500,
            earned: 100000,
            paid: 25000,
            paidByType: { vatsy: 25000, advance: 0, settlement: 0 },
            due: 75000,
          },
        ]),
      ),
      http.get('/api/moulders/m1', () => HttpResponse.json(rakoto)),
    );
    renderRoutes(routes, '/mouleurs/m1');

    const balance = await screen.findByRole('region', {
      name: 'Versements sur la campagne 2026 · Tranche 1',
    });
    expect(await within(balance).findByText('Gagné')).toBeInTheDocument();
    expect(within(balance).getByText('100 000 Ar')).toBeInTheDocument();
    expect(within(balance).getByText('Reste dû')).toBeInTheDocument();
    expect(within(balance).getByText('75 000 Ar')).toBeInTheDocument();
  });

  it('says there is no entry yet rather than showing a zero balance', async () => {
    server.use(
      ...baseHandlers(),
      http.get('/api/moulders/m1', () => HttpResponse.json(rakoto)),
    );
    renderRoutes(routes, '/mouleurs/m1');

    await screen.findByRole('heading', { name: 'Rakoto' });
    expect(await screen.findByText('Aucune saisie sur cette campagne.')).toBeInTheDocument();
  });
});
