import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewExpensePage } from './NewExpensePage.js';

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
      <NewExpensePage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/depenses', element: <p>Liste des dépenses</p> },
  { path: '/depenses/nouvelle', element: <Page /> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/rice-fields', () =>
    HttpResponse.json([
      { id: 'r1', name: 'Riz-1', location: 'Manandriana', surfaceM2: 102, contractType: 'durable' },
    ]),
  ),
  http.get('/api/campaigns/c1/kiln-batches', () =>
    HttpResponse.json([
      {
        id: 'b1',
        campaignId: 'c1',
        loadedOn: '2026-06-01',
        unloadedOn: null,
        quantity: 40000,
        cost: { expenses: 0, labour: 0, total: 0 },
      },
    ]),
  ),
];

describe('NewExpensePage', () => {
  it('records an expense with no link and goes back to the list', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/expenses', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'e1', campaignId: 'c1', ...(body as object) },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/depenses/nouvelle');

    await user.selectOptions(await screen.findByLabelText('Catégorie'), 'fuel');
    await user.type(screen.getByLabelText('Montant (Ar)'), '60000');
    await user.type(screen.getByLabelText('Libellé'), ' Gasoil ');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Liste des dépenses')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/depenses');
    expect(body).toEqual({
      date: today(),
      category: 'fuel',
      amount: 60000,
      label: 'Gasoil',
      riceFieldId: null,
      kilnBatchId: null,
    });
  });

  it('starts from the category and the rice field the URL names', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/expenses', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'e1', campaignId: 'c1', ...(body as object) },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/depenses/nouvelle?category=rice_field&riceFieldId=r1');

    expect(await screen.findByLabelText('Catégorie')).toHaveValue('rice_field');
    expect(screen.getByLabelText('Rizière (facultatif)')).toHaveValue('r1');

    await user.type(screen.getByLabelText('Montant (Ar)'), '500000');
    await user.type(screen.getByLabelText('Libellé'), 'Contrat Riz-1');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByText('Liste des dépenses');
    expect(body).toMatchObject({ category: 'rice_field', riceFieldId: 'r1', kilnBatchId: null });
  });

  it('requires an amount and a label', async () => {
    server.use(...baseHandlers);
    const user = userEvent.setup();
    renderRoutes(routes, '/depenses/nouvelle');

    await user.click(await screen.findByRole('button', { name: 'Enregistrer' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Un montant entier en ariary est attendu.',
      'Le libellé est requis.',
    ]);
  });
});
