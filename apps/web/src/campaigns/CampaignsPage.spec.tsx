import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { CampaignsPage } from './CampaignsPage.js';

const open = {
  id: 'c2',
  year: 2026,
  tranche: 1,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};
const closed = {
  ...open,
  id: 'c1',
  year: 2025,
  startedOn: '2025-05-02',
  closedOn: '2025-11-30',
  kilnLoadingRate: null,
};

describe('CampaignsPage', () => {
  it('lists the campaigns as the API orders them, with their state and rates', async () => {
    server.use(http.get('/api/campaigns', () => HttpResponse.json([open, closed])));
    renderWithProviders(<CampaignsPage />);

    const [first, second] = await screen.findAllByRole('article');
    expect(first).toHaveAccessibleName('Campagne 2026 · Tranche 1');
    expect(within(first!).getByRole('link', { name: 'Campagne 2026 · Tranche 1' })).toHaveAttribute(
      'href',
      '/campagnes/c2',
    );
    expect(second).toHaveAccessibleName('Campagne 2025 · Tranche 1');
    expect(within(first!).getByText('Ouverte depuis le 10 mai 2026')).toBeInTheDocument();
    expect(within(first!).getByText('40 Ar la brique')).toBeInTheDocument();
    expect(within(second!).getByText('Clôturée le 30 novembre 2025')).toBeInTheDocument();
    expect(within(second!).getByText('À fixer')).toBeInTheDocument();
  });

  it('says so when there is no campaign yet', async () => {
    server.use(http.get('/api/campaigns', () => HttpResponse.json([])));
    renderWithProviders(<CampaignsPage />);
    expect(await screen.findByText('Aucune campagne.')).toBeInTheDocument();
  });

  it('shows the API message when the list cannot load', async () => {
    server.use(
      http.get('/api/campaigns', () =>
        HttpResponse.json({ message: 'database down' }, { status: 503 }),
      ),
    );
    renderWithProviders(<CampaignsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chargement impossible : database down',
    );
  });
});
