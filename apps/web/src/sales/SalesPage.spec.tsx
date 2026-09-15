import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { plain } from '../test/text.js';
import { SalesPage } from './SalesPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};

const ordered = {
  id: 's2',
  campaignId: 'c1',
  clientId: 'cl1',
  date: '2026-08-10',
  orderedQuantity: 5000,
  unitPrice: 250,
  payment: null,
  deliveredQuantity: 2500,
  total: 1250000,
  status: 'ordered' as const,
};
const paid = {
  ...ordered,
  id: 's1',
  date: '2026-08-01',
  deliveredQuantity: 5000,
  payment: { paidOn: '2026-08-05', amountReceived: 1250000 },
  status: 'paid' as const,
};

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <SalesPage />
    </CurrentCampaignProvider>,
  );
}

describe('SalesPage', () => {
  it('lists the sales with their status and how much has left the yard', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/sales', () => HttpResponse.json([ordered, paid])),
      http.get('/api/clients', () =>
        HttpResponse.json([{ id: 'cl1', name: 'Rabe', phone: null, locality: 'Antsirabe' }]),
      ),
    );
    mount();

    const rows = await screen.findAllByRole('listitem');
    expect(rows.map((row) => plain(row.textContent))).toEqual([
      'Rabe10 août 2026 · Commandée · 2 500 / 5 000 briques1 250 000 Ar',
      'Rabe1 août 2026 · Payée · 5 000 briques livrées1 250 000 Ar',
    ]);
    expect(screen.getAllByRole('link', { name: 'Rabe' })[0]).toHaveAttribute('href', '/ventes/s2');
  });

  it('says so when nothing has been sold yet', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/sales', () => HttpResponse.json([])),
      http.get('/api/clients', () => HttpResponse.json([])),
    );
    mount();
    expect(await screen.findByText('Aucune vente enregistrée.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enregistrer une vente' })).toHaveAttribute(
      'href',
      '/ventes/nouvelle',
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
