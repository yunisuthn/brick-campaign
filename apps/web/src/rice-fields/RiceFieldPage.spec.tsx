import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { chooseOption } from '../test/select.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { RiceFieldPage } from './RiceFieldPage.js';

function Page() {
  return (
    <CurrentCampaignProvider>
      <RiceFieldPage />
    </CurrentCampaignProvider>
  );
}

const routes = [{ path: '/rizieres/:id', element: <Page /> }];

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

/** The page now shows what the field costs on the current campaign, summed from its expenses. */
const baseHandlers = [
  http.get('/api/campaigns', () => HttpResponse.json([campaign])),
  http.get('/api/campaigns/c1/expenses', () => HttpResponse.json([])),
];
const ambany = {
  id: 'r1',
  name: 'Ambany',
  location: 'Sud',
  surfaceM2: 2500,
  contractType: 'durable',
};

describe('RiceFieldPage', () => {
  it('edits the rice field and sends every field back', async () => {
    let body: unknown;
    server.use(
      ...baseHandlers,
      http.get('/api/rice-fields/r1', () => HttpResponse.json(ambany)),
      http.patch('/api/rice-fields/r1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...ambany, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/rizieres/r1');

    const surface = await screen.findByLabelText('Surface (m²)');
    expect(surface).toHaveValue('2500');
    expect(screen.getByLabelText('Type de contrat')).toHaveTextContent('Durable');
    await user.clear(surface);
    await chooseOption(user, 'Type de contrat', 'De campagne');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByRole('button', { name: 'Enregistrer' });
    expect(body).toEqual({
      name: 'Ambany',
      location: 'Sud',
      surfaceM2: null,
      contractType: 'seasonal',
    });
  });

  it('says the rice field is not found on a 404', async () => {
    server.use(
      ...baseHandlers,
      http.get('/api/rice-fields/nope', () =>
        HttpResponse.json({ message: 'Rice field nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/rizieres/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Rizière introuvable.');
  });
});
