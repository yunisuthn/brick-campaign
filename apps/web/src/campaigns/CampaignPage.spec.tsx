import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { CampaignPage } from './CampaignPage.js';

const routes = [{ path: '/campagnes/:id', element: <CampaignPage /> }];

describe('CampaignPage', () => {
  it('shows the campaign the URL names', async () => {
    server.use(
      http.get('/api/campaigns/c1', () =>
        HttpResponse.json({
          id: 'c1',
          year: 2026,
          startedOn: '2026-05-10',
          closedOn: null,
          mouldingRate: 40,
          transportRate: 10,
          kilnLoadingRate: 5,
        }),
      ),
    );
    renderRoutes(routes, '/campagnes/c1');

    expect(await screen.findByRole('heading', { name: 'Campagne 2026' })).toBeInTheDocument();
    expect(screen.getByText('Ouverte depuis le 10 mai 2026')).toBeInTheDocument();
    expect(screen.getByText('5 Ar la brique')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Toutes les campagnes' })).toHaveAttribute(
      'href',
      '/campagnes',
    );
  });

  it('says the campaign is not found on a 404', async () => {
    server.use(
      http.get('/api/campaigns/nope', () =>
        HttpResponse.json({ message: 'Campaign nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/campagnes/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Campagne introuvable.');
  });
});
