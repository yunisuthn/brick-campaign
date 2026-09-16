import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { plain } from '../test/text.js';
import { server } from '../test/server.js';
import { ProductionsPage } from './ProductionsPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
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
            startedOn: '2026-06-02',
            endedOn: null,
            quantity: 1200,
          },
          {
            id: 'p1',
            campaignId: 'c1',
            moulderId: 'gone',
            riceFieldId: 'r1',
            startedOn: '2026-06-01',
            endedOn: null,
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
    expect(screen.getByRole('link', { name: 'Rakoto' })).toHaveAttribute('href', '/productions/p2');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'Rakoto2 juin 2026 · Ambany1 200 briques',
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

  it('filters by moulder and period with the API query, and says when nothing matches', async () => {
    const searches: string[] = [];
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/productions', ({ request }) => {
        searches.push(new URL(request.url).search);
        return HttpResponse.json([]);
      }),
      http.get('/api/moulders', () =>
        HttpResponse.json([
          { id: 'm1', name: 'Rakoto', memberCount: 3, active: true },
          { id: 'm2', name: 'Parti', memberCount: 1, active: false },
        ]),
      ),
      http.get('/api/rice-fields', () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    mount();

    expect(await screen.findByText('Aucune production saisie.')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Parti (retiré)' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Mouleur'), 'm1');
    await user.type(screen.getByLabelText('Du'), '01/06/2026');
    await user.type(screen.getByLabelText('Au'), '30/06/2026');

    expect(await screen.findByText('Aucune production pour ces critères.')).toBeInTheDocument();
    expect(searches.at(-1)).toBe('?moulderId=m1&from=2026-06-01&to=2026-06-30');
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
