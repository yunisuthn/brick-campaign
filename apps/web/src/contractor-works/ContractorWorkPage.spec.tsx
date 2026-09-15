import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { ContractorWorkPage } from './ContractorWorkPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};
const work = {
  id: 'w1',
  campaignId: 'c1',
  kilnBatchId: 'b1',
  type: 'transport' as const,
  contractorName: 'Solo',
  date: '2026-06-02',
  quantity: 40000,
  rate: 10,
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <ContractorWorkPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/lots/:id', element: <p>Fiche du lot</p> },
  { path: '/prestations/:id', element: <Page /> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/campaigns/c1/balances/contractors', () => HttpResponse.json([])),
];

describe('ContractorWorkPage', () => {
  it('corrects the work and keeps it on its batch', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/contractor-works/w1', () => HttpResponse.json(work)),
      http.patch('/api/campaigns/c1/contractor-works/w1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...work, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/prestations/w1');

    expect(await screen.findByRole('heading', { name: /Solo/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour au lot' })).toHaveAttribute('href', '/lots/b1');

    const quantity = screen.getByLabelText('Quantité (briques)');
    await user.clear(quantity);
    await user.type(quantity, '38000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText(/38 000 briques/)).toBeInTheDocument();
    expect(body).toEqual({
      date: '2026-06-02',
      type: 'transport',
      contractorName: 'Solo',
      quantity: 38000,
      rate: 10,
    });
  });

  it('cancels the work after a confirmation and goes back to the batch', async () => {
    let cancelled = false;
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/contractor-works/w1', () => HttpResponse.json(work)),
      http.delete('/api/campaigns/c1/contractor-works/w1', () => {
        cancelled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/prestations/w1');

    await user.click(await screen.findByRole('button', { name: 'Annuler la prestation' }));
    expect(cancelled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));

    expect(await screen.findByText('Fiche du lot')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/lots/b1');
    expect(cancelled).toBe(true);
  });

  it('says the work is not found on a 404, as after a cancellation', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/campaigns/c1/contractor-works/nope', () =>
        HttpResponse.json({ message: 'Contractor work nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/prestations/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Prestation introuvable.');
  });
});
