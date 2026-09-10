import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { KilnBatchesPage } from './KilnBatchesPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

const stock = {
  campaignId: 'c1',
  produced: 100000,
  loaded: 80000,
  unloaded: 40000,
  delivered: 5000,
  raw: 20000,
  inKiln: 40000,
  fired: 35000,
};

const inKiln = {
  id: 'b2',
  campaignId: 'c1',
  loadedOn: '2026-07-10',
  unloadedOn: null,
  quantity: 40000,
  cost: { expenses: 0, labour: null, total: null },
};
const unloaded = {
  id: 'b1',
  campaignId: 'c1',
  loadedOn: '2026-06-01',
  unloadedOn: '2026-06-20',
  quantity: 40000,
  cost: { expenses: 320000, labour: 200000, total: 520000 },
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <KilnBatchesPage />
    </CurrentCampaignProvider>,
  );
}

describe('KilnBatchesPage', () => {
  it('shows the three stock levels and the batches with their state and cost', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/stock', () => HttpResponse.json(stock)),
      http.get('/api/campaigns/c1/kiln-batches', () => HttpResponse.json([inKiln, unloaded])),
    );
    mount();

    const levels = await screen.findByRole('region', { name: 'Stock' });
    expect(within(levels).getByText('Crue').nextSibling).toHaveTextContent('20 000 briques');
    expect(within(levels).getByText('Au four').nextSibling).toHaveTextContent('40 000 briques');
    expect(within(levels).getByText('Cuite').nextSibling).toHaveTextContent('35 000 briques');

    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first!).getByText(/encore au four/)).toBeInTheDocument();
    expect(within(first!).getByText('tarif de prestation à fixer')).toBeInTheDocument();
    expect(within(second!).getByText(/défourné le 20 juin 2026/)).toBeInTheDocument();
    expect(within(second!).getByText(/520/)).toBeInTheDocument();
    expect(within(first!).getByRole('link')).toHaveAttribute('href', '/lots/b2');
  });

  it('says so when nothing has been fired yet', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/stock', () =>
        HttpResponse.json({ ...stock, loaded: 0, unloaded: 0, inKiln: 0, fired: 0, raw: 100000 }),
      ),
      http.get('/api/campaigns/c1/kiln-batches', () => HttpResponse.json([])),
    );
    mount();
    expect(await screen.findByText('Aucun lot enfourné.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enfourner un lot' })).toHaveAttribute(
      'href',
      '/lots/nouveau',
    );
  });

  it('asks for a campaign first when there is none', async () => {
    server.use(http.get('/api/campaigns', () => HttpResponse.json([])));
    mount();
    expect(await screen.findByRole('link', { name: 'créez la première' })).toHaveAttribute(
      'href',
      '/campagnes/nouvelle',
    );
  });
});
