import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { RiceFieldExpenses } from './RiceFieldExpenses.js';

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
      <RiceFieldExpenses riceFieldId="r1" />
    </CurrentCampaignProvider>,
  );
}

describe('RiceFieldExpenses', () => {
  it('totals the expenses attached to the rice field on the current campaign', async () => {
    let search = '';
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/expenses', ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json([
          {
            id: 'e1',
            campaignId: 'c1',
            kilnBatchId: null,
            riceFieldId: 'r1',
            date: '2026-05-02',
            category: 'rice_field',
            amount: 500000,
            label: 'Contrat',
          },
          {
            id: 'e2',
            campaignId: 'c1',
            kilnBatchId: null,
            riceFieldId: 'r1',
            date: '2026-05-20',
            category: 'other',
            amount: 20000,
            label: 'Bornage',
          },
        ]);
      }),
    );
    mount();

    expect(
      await screen.findByRole('heading', { name: 'Coût sur la campagne 2026 · Tranche 1' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('520 000 Ar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contrat' })).toHaveAttribute('href', '/depenses/e1');
    expect(search).toBe('?riceFieldId=r1');
  });

  it('offers to record one when the field carries no expense yet', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/expenses', () => HttpResponse.json([])),
    );
    mount();

    expect(
      await screen.findByText('Aucune dépense rattachée à cette rizière.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0 Ar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Saisir une dépense pour cette rizière' }),
    ).toHaveAttribute('href', '/depenses/nouvelle?category=rice_field&riceFieldId=r1');
  });
});
