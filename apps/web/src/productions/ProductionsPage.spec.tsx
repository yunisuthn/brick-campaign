import { screen, within } from '@testing-library/react';
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
  tranche: 1,
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

    expect(await screen.findByRole('heading', { name: 'Productions' })).toBeInTheDocument();
    expect(await screen.findByText('Campagne 2026 · Tranche 1')).toBeInTheDocument();
    const rows = await screen.findAllByRole('listitem');
    expect(screen.getByRole('link', { name: /Rakoto/ })).toHaveAttribute('href', '/productions/p2');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'RakotoAmbany1 200 briques',
      'Mouleur inconnuAmbany800 briques',
    ]);
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((day) => plain(day.textContent)),
    ).toEqual(['2 juin 2026', '1 juin 2026']);
    expect(plain(screen.getByText(/Total affiché/).textContent)).toBe(
      'Total affiché : 2 000 briques',
    );
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

    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.click(screen.getByLabelText('Mouleur'));
    expect(screen.getByRole('option', { name: 'Parti (retiré)' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Rakoto' }));
    await user.type(screen.getByLabelText('Du'), '01/06/2026');
    await user.type(screen.getByLabelText('Au'), '30/06/2026');

    expect(await screen.findByText('Aucune production pour ces critères.')).toBeInTheDocument();
    expect(searches.at(-1)).toBe('?moulderId=m1&from=2026-06-01&to=2026-06-30');
  });

  it('groups the entries of one day under it, with the day’s total', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/productions', () =>
        HttpResponse.json(
          [
            ['p3', '2026-06-02', 1200],
            ['p2', '2026-06-02', 600],
            ['p1', '2026-06-01', 800],
          ].map(([id, startedOn, quantity]) => ({
            id,
            campaignId: 'c1',
            moulderId: 'm1',
            riceFieldId: 'r1',
            startedOn,
            endedOn: null,
            quantity,
          })),
        ),
      ),
      http.get('/api/moulders', () =>
        HttpResponse.json([{ id: 'm1', name: 'Rakoto', memberCount: 3, active: true }]),
      ),
      http.get('/api/rice-fields', () => HttpResponse.json([])),
    );
    mount();

    const june2 = await screen.findByRole('region', { name: '2 juin 2026' });
    const june1 = screen.getByRole('region', { name: '1 juin 2026' });
    expect(plain(within(june2).getByText(/^1 800/).textContent)).toBe('1 800 briques');
    expect(within(june2).getAllByRole('listitem')).toHaveLength(2);
    expect(within(june1).getAllByRole('listitem')).toHaveLength(1);
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
