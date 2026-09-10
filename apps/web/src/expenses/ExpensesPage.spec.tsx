import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { plain } from '../test/text.js';
import { server } from '../test/server.js';
import { ExpensesPage } from './ExpensesPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

const contract = {
  id: 'e1',
  campaignId: 'c1',
  kilnBatchId: null,
  riceFieldId: 'r1',
  date: '2026-05-02',
  category: 'rice_field' as const,
  amount: 500000,
  label: 'Contrat Riz-1',
};
const akofa = {
  ...contract,
  id: 'e2',
  riceFieldId: null,
  category: 'akofa' as const,
  amount: 320000,
  label: 'Akofa',
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <ExpensesPage />
    </CurrentCampaignProvider>,
  );
}

describe('ExpensesPage', () => {
  it('lists the expenses with their category and totals what is shown', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/expenses', () => HttpResponse.json([contract, akofa])),
    );
    mount();

    const rows = await screen.findAllByRole('listitem');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'Contrat Riz-12 mai 2026 · Rizière500 000 Ar',
      'Akofa2 mai 2026 · Akofa320 000 Ar',
    ]);
    expect(screen.getByText('820 000 Ar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contrat Riz-1' })).toHaveAttribute(
      'href',
      '/depenses/e1',
    );
  });

  it('filters by category with the API query', async () => {
    const searches: string[] = [];
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/expenses', ({ request }) => {
        searches.push(new URL(request.url).search);
        return HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    mount();

    expect(await screen.findByText('Aucune dépense saisie.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Catégorie'), 'rice_field');

    expect(await screen.findByText('Aucune dépense dans cette catégorie.')).toBeInTheDocument();
    expect(searches.at(-1)).toBe('?category=rice_field');
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
