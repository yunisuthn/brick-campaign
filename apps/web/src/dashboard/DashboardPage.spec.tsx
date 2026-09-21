import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { DashboardPage } from './DashboardPage.js';

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

const dashboard = {
  campaignId: 'c1',
  stock,
  revenue: 3650000,
  received: 1250000,
  outstanding: 2400000,
  expenses: {
    total: 820000,
    byCategory: {
      rice_field: 500000,
      akofa: 320000,
      tai_charbon: 0,
      fuel: 0,
      repair: 0,
      food: 0,
      other: 0,
    },
  },
  labour: {
    moulding: 800000,
    transport: 200000,
    kilnLoading: 120000,
    total: 1120000,
    paid: 400000,
    outstanding: 720000,
  },
  deliveryCosts: 120000,
  result: -810000,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <DashboardPage />
    </CurrentCampaignProvider>,
  );
}

describe('DashboardPage', () => {
  it('leads with the result and shows the figures of the campaign', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/dashboard', () => HttpResponse.json(dashboard)),
    );
    mount();

    const result = await screen.findByRole('region', { name: 'Résultat' });
    expect(within(result).getByText('-810 000 Ar')).toBeInTheDocument();

    const sales = screen.getByRole('region', { name: 'Ventes' });
    expect(within(sales).getByText('Reste à encaisser').nextSibling).toHaveTextContent(
      '2 400 000 Ar',
    );

    const labour = screen.getByRole('region', { name: 'Main-d’œuvre' });
    expect(within(labour).getByText('Reste à verser').nextSibling).toHaveTextContent('720 000 Ar');

    const expenses = screen.getByRole('region', { name: 'Dépenses' });
    expect(within(expenses).getByText('Rizière')).toBeInTheDocument();
    expect(within(expenses).queryByText('Carburant')).not.toBeInTheDocument();
    expect(within(expenses).getByText('Livraisons').nextSibling).toHaveTextContent('120 000 Ar');

    expect(
      within(screen.getByRole('region', { name: 'Stock' })).getByText('Cuite'),
    ).toBeInTheDocument();
  });

  it('says the result is unknown while a rate is not fixed', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([{ ...campaign, mouldingRates: [] }])),
      http.get('/api/campaigns/c1/dashboard', () =>
        HttpResponse.json({
          ...dashboard,
          labour: { ...dashboard.labour, moulding: null, total: null, outstanding: null },
          result: null,
        }),
      ),
    );
    mount();

    const result = await screen.findByRole('region', { name: 'Résultat' });
    expect(within(result).getByText('Inconnu tant qu’un tarif n’est pas fixé')).toBeInTheDocument();

    const labour = screen.getByRole('region', { name: 'Main-d’œuvre' });
    expect(within(labour).getAllByText('Tarif à fixer')).toHaveLength(3);
    // What was paid out is known whatever the rate.
    expect(within(labour).getByText('Versé').nextSibling).toHaveTextContent('400 000 Ar');
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
