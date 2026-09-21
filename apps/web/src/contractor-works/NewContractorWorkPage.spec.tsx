import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { chooseOption } from '../test/select.js';
import { server } from '../test/server.js';
import { NewContractorWorkPage } from './NewContractorWorkPage.js';

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

function Page() {
  return (
    <CurrentCampaignProvider>
      <NewContractorWorkPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/lots/:id', element: <p>Fiche du lot</p> },
  { path: '/lots/:id/prestations/nouvelle', element: <Page /> },
];

const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/campaigns/c1/balances/contractors', () =>
    HttpResponse.json([
      {
        contractorName: 'Solo',
        bricksByType: { transport: 40000, kiln_loading: 0 },
        earned: 400000,
        paid: 0,
        paidByType: { vatsy: 0, advance: 0, settlement: 0 },
        due: 400000,
      },
    ]),
  ),
];

describe('NewContractorWorkPage', () => {
  it('attaches the work to the batch of the URL and goes back to it', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.post('/api/campaigns/c1/contractor-works', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'w1', campaignId: 'c1', ...(body as object) },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/lots/b1/prestations/nouvelle');

    await screen.findByLabelText('Type de prestation');
    await chooseOption(user, 'Type de prestation', 'Enfournement');
    await user.type(screen.getByLabelText('Nom du prestataire'), ' Solo ');
    await user.type(screen.getByLabelText('Quantité (briques)'), '40000');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Fiche du lot')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/lots/b1');
    expect(body).toEqual({
      kilnBatchId: 'b1',
      date: today(),
      type: 'kiln_loading',
      contractorName: 'Solo',
      quantity: 40000,
      rate: null,
    });
  });

  it('requires a name and a whole positive quantity', async () => {
    server.use(...baseHandlers);
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/b1/prestations/nouvelle');

    await user.type(await screen.findByLabelText('Quantité (briques)'), '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le nom du prestataire est requis.',
      'Un nombre entier de briques est attendu.',
    ]);
  });
});
