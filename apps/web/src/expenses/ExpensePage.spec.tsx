import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { ExpensePage } from './ExpensePage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};
const expense = {
  id: 'e1',
  campaignId: 'c1',
  kilnBatchId: null,
  riceFieldId: 'r1',
  date: '2026-05-02',
  category: 'rice_field' as const,
  amount: 500000,
  label: 'Contrat Riz-1',
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <ExpensePage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/depenses', element: <p>Liste des dépenses</p> },
  { path: '/depenses/:id', element: <Page /> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/rice-fields', () =>
    HttpResponse.json([
      { id: 'r1', name: 'Riz-1', location: 'Manandriana', surfaceM2: 102, contractType: 'durable' },
    ]),
  ),
  http.get('/api/campaigns/c1/kiln-batches', () => HttpResponse.json([])),
];

describe('ExpensePage', () => {
  it('corrects the amount and keeps the rice field it is attached to', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/expenses/e1', () => HttpResponse.json(expense)),
      http.patch('/api/campaigns/c1/expenses/e1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...expense, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/depenses/e1');

    expect(await screen.findByRole('heading', { name: /Contrat Riz-1/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Rizière (facultatif)')).toHaveValue('r1');

    const amount = screen.getByLabelText('Montant (Ar)');
    await user.clear(amount);
    await user.type(amount, '550000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText(/550 000 Ar/)).toBeInTheDocument();
    expect(body).toEqual({
      date: '2026-05-02',
      category: 'rice_field',
      amount: 550000,
      label: 'Contrat Riz-1',
      riceFieldId: 'r1',
      kilnBatchId: null,
    });
  });

  it('detaches the rice field when the link is cleared', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/expenses/e1', () => HttpResponse.json(expense)),
      http.patch('/api/campaigns/c1/expenses/e1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...expense, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/depenses/e1');

    await user.selectOptions(await screen.findByLabelText('Rizière (facultatif)'), '');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByRole('heading', { name: /Contrat Riz-1/ });
    expect(body).toMatchObject({ riceFieldId: null });
  });

  it('cancels the expense after a confirmation and goes back to the list', async () => {
    let cancelled = false;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/expenses/e1', () => HttpResponse.json(expense)),
      http.delete('/api/campaigns/c1/expenses/e1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/depenses/e1');

    await user.click(await screen.findByRole('button', { name: 'Annuler la dépense' }));
    expect(cancelled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Liste des dépenses')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/depenses');
    expect(cancelled).toBe(true);
  });

  it('says the expense is not found on a 404, as after a cancellation', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/expenses/nope', () =>
        HttpResponse.json({ message: 'Expense nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/depenses/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Dépense introuvable.');
  });
});
