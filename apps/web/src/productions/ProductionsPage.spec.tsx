import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { ProductionsPage } from './ProductionsPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <ProductionsPage />
    </CurrentCampaignProvider>,
  );
}

describe('ProductionsPage', () => {
  it('lists the entries of the current campaign with the names behind the ids', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/productions', () =>
        HttpResponse.json([
          {
            id: 'p2',
            campaignId: 'c1',
            moulderId: 'm1',
            riceFieldId: 'r1',
            date: '2026-06-02',
            quantity: 1200,
          },
          {
            id: 'p1',
            campaignId: 'c1',
            moulderId: 'gone',
            riceFieldId: 'r1',
            date: '2026-06-01',
            quantity: 800,
          },
        ]),
      ),
      http.get('/api/moulders', ({ request }) => {
        expect(new URL(request.url).searchParams.get('includeInactive')).toBe('true');
        return HttpResponse.json([{ id: 'm1', name: 'Rakoto', memberCount: 3, active: true }]);
      }),
      http.get('/api/rice-fields', () =>
        HttpResponse.json([
          { id: 'r1', name: 'Ambany', location: 'Sud', surfaceM2: null, contractType: 'durable' },
        ]),
      ),
    );
    mount();

    expect(
      await screen.findByRole('heading', { name: 'Productions · Campagne 2026' }),
    ).toBeInTheDocument();
    const rows = await screen.findAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Rakoto2 juin 2026 · Ambany1 200 briques',
      'Mouleur inconnu1 juin 2026 · Ambany800 briques',
    ]);
  });

  it('says so when the campaign has no entry yet', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/productions', () => HttpResponse.json([])),
      http.get('/api/moulders', () => HttpResponse.json([])),
      http.get('/api/rice-fields', () => HttpResponse.json([])),
    );
    mount();
    expect(await screen.findByText('Aucune production saisie.')).toBeInTheDocument();
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
