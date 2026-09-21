import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { plain } from '../test/text.js';
import { server } from '../test/server.js';
import { PaymentsPage } from './PaymentsPage.js';

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

const toMoulder = {
  id: 'v1',
  campaignId: 'c1',
  moulderId: 'm1',
  contractorName: null,
  type: 'vatsy' as const,
  date: '2026-06-05',
  amount: 50000,
};
const toContractor = {
  ...toMoulder,
  id: 'v2',
  moulderId: null,
  contractorName: 'Solo',
  type: 'advance' as const,
  date: '2026-06-04',
  amount: 120000,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <PaymentsPage />
    </CurrentCampaignProvider>,
  );
}

describe('PaymentsPage', () => {
  it('lists the payments with their beneficiary, type and amount', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/payments', () => HttpResponse.json([toMoulder, toContractor])),
      http.get('/api/moulders', () =>
        HttpResponse.json([{ id: 'm1', name: 'Rakoto', memberCount: 3, active: true }]),
      ),
    );
    mount();

    const rows = await screen.findAllByRole('listitem');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'Rakoto5 juin 2026 · Vatsy · Éditer · Supprimer50 000 Ar',
      'Solo4 juin 2026 · Avance · Éditer · Supprimer120 000 Ar',
    ]);
    expect(screen.getByRole('link', { name: 'Rakoto' })).toHaveAttribute('href', '/versements/v1');
  });

  it('deletes a payment only after a second click confirms it', async () => {
    let deleted = false;
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/payments', () => HttpResponse.json(deleted ? [] : [toMoulder])),
      http.get('/api/moulders', () =>
        HttpResponse.json([{ id: 'm1', name: 'Rakoto', memberCount: 3, active: true }]),
      ),
      http.delete('/api/campaigns/c1/payments/v1', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    mount();

    await user.click(await screen.findByRole('button', { name: 'Supprimer' }));
    expect(screen.queryByText('Aucun versement saisi.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmer la suppression' }));
    expect(await screen.findByText('Aucun versement saisi.')).toBeInTheDocument();
  });

  it('filters by moulder or by contractor name, never by both at once', async () => {
    const searches: string[] = [];
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/payments', ({ request }) => {
        searches.push(new URL(request.url).search);
        return HttpResponse.json([]);
      }),
      http.get('/api/moulders', () =>
        HttpResponse.json([{ id: 'm1', name: 'Rakoto', memberCount: 3, active: true }]),
      ),
      http.get('/api/campaigns/c1/balances/contractors', () =>
        HttpResponse.json([{ contractorName: 'Solo' }]),
      ),
    );
    const user = userEvent.setup();
    mount();

    expect(await screen.findByText('Aucun versement saisi.')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Mouleur'));
    await user.click(screen.getByRole('option', { name: 'Rakoto' }));
    expect(await screen.findByText('Aucun versement pour ces critères.')).toBeInTheDocument();
    expect(searches.at(-1)).toBe('?moulderId=m1');

    await user.click(screen.getByLabelText('Prestataire'));
    await user.click(screen.getByRole('option', { name: 'Solo' }));
    await screen.findByText('Aucun versement pour ces critères.');
    expect(searches.at(-1)).toBe('?contractorName=Solo');
    expect(screen.getByLabelText('Mouleur')).toHaveTextContent('Tous');
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
