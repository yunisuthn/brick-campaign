import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { formatAmount } from '../format.js';
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

/** An amount as the screen shows it, its narrow spaces read as the plain ones Testing Library
 * normalises them to. */
const ar = (value: number) => formatAmount(value).replace(/\s/g, ' ');

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

    const result = await screen.findByRole('region', { name: 'Résultat de la campagne' });
    expect(within(result).getByText(ar(-810000))).toBeInTheDocument();
    expect(within(result).getByText('Déficit')).toBeInTheDocument();
    // The result is worked out on what was received: 1 250 000 received, 2 060 000 of costs.
    expect(
      within(result).getByText(`Encaissé ${ar(1250000)} · Coûts ${ar(2060000)}`),
    ).toBeInTheDocument();

    const stock = screen.getByRole('region', { name: 'Stock de briques' });
    expect(within(stock).getByText('Cuite').nextSibling).toHaveTextContent('35 000');
    expect(within(stock).getByText(/prêtes à la vente/)).toBeInTheDocument();

    const sales = screen.getByRole('region', { name: 'Ventes' });
    expect(within(sales).getByText('Reste à encaisser').nextSibling).toHaveTextContent(ar(2400000));
    expect(within(sales).getByRole('button', { name: 'Nouvelle vente' })).toBeInTheDocument();

    const labour = screen.getByRole('region', { name: 'Main-d’œuvre' });
    expect(within(labour).getByText('Reste à verser').nextSibling).toHaveTextContent(ar(720000));
    expect(within(labour).queryByText('Avance aux ouvriers')).not.toBeInTheDocument();

    const expenses = screen.getByRole('region', { name: 'Dépenses' });
    expect(within(expenses).getByText('Total').nextSibling).toHaveTextContent(ar(820000));
    expect(within(expenses).getByText('Livraisons').nextSibling).toHaveTextContent(ar(120000));
    expect(expenses.closest('a')).toHaveAttribute('href', '/depenses');
  });

  it('marks a positive result as a profit', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/dashboard', () =>
        HttpResponse.json({ ...dashboard, result: 420000 }),
      ),
    );
    mount();

    const result = await screen.findByRole('region', { name: 'Résultat de la campagne' });
    expect(within(result).getByText(ar(420000))).toBeInTheDocument();
    expect(within(result).getByText('Bénéfice')).toBeInTheDocument();
  });

  it('shows money paid beyond what is owed as an advance, never a negative balance', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/dashboard', () =>
        HttpResponse.json({
          ...dashboard,
          labour: { ...dashboard.labour, paid: 1500000, outstanding: -380000 },
        }),
      ),
    );
    mount();

    const labour = await screen.findByRole('region', { name: 'Main-d’œuvre' });
    expect(within(labour).queryByText('Reste à verser')).not.toBeInTheDocument();
    const advance = within(labour).getByRole('note');
    expect(within(advance).getByText('Avance aux ouvriers').nextSibling).toHaveTextContent(
      ar(380000),
    );
    expect(within(advance).getByText('Versé au-delà du dû')).toBeInTheDocument();
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

    const result = await screen.findByRole('region', { name: 'Résultat de la campagne' });
    expect(within(result).getByText('Inconnu tant qu’un tarif n’est pas fixé')).toBeInTheDocument();
    expect(within(result).queryByText('Déficit')).not.toBeInTheDocument();

    const labour = screen.getByRole('region', { name: 'Main-d’œuvre' });
    expect(within(labour).getAllByText('Tarif à fixer')).toHaveLength(3);
    // What was paid out is known whatever the rate.
    expect(within(labour).getByText('Versé').nextSibling).toHaveTextContent(ar(400000));
  });

  it('enters a sale and its first payment from the sheet, then refreshes the figures', async () => {
    const posted: { sale?: unknown; payment?: unknown } = {};
    let dashboardReads = 0;
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/dashboard', () => {
        dashboardReads++;
        return HttpResponse.json(dashboard);
      }),
      http.get('/api/clients', () =>
        HttpResponse.json([{ id: 'k1', name: 'Rabe', phone: null, locality: null }]),
      ),
      http.post('/api/campaigns/c1/sales', async ({ request }) => {
        posted.sale = await request.json();
        return HttpResponse.json({ id: 's1', campaignId: 'c1', ...(posted.sale as object) });
      }),
      http.post('/api/campaigns/c1/sales/s1/payments', async ({ request }) => {
        posted.payment = await request.json();
        return HttpResponse.json({ id: 'p1', saleId: 's1', ...(posted.payment as object) });
      }),
    );
    const user = userEvent.setup();
    mount();

    await user.click(await screen.findByRole('button', { name: 'Nouvelle vente' }));
    const sheet = await screen.findByRole('dialog', { name: 'Nouvelle vente' });
    expect(within(sheet).getByText('Campagne 2026 · Tranche 1')).toBeInTheDocument();
    expect(within(sheet).getByText('Laissez 0 si le client paiera plus tard.')).toBeInTheDocument();

    await user.click(within(sheet).getByRole('combobox', { name: 'Client' }));
    await user.click(await screen.findByRole('option', { name: 'Rabe' }));
    await user.type(within(sheet).getByLabelText('Quantité (briques)'), '2500');
    await user.type(within(sheet).getByLabelText('Prix unitaire (Ar)'), '300');
    expect(within(sheet).getByRole('status')).toHaveTextContent(ar(750000));

    const received = within(sheet).getByLabelText('Montant encaissé (Ar)');
    await user.clear(received);
    await user.type(received, '500000');
    await user.click(within(sheet).getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Nouvelle vente' })).not.toBeInTheDocument(),
    );
    expect(posted.sale).toMatchObject({ clientId: 'k1', orderedQuantity: 2500, unitPrice: 300 });
    expect(posted.payment).toMatchObject({ amount: 500000 });
    expect(dashboardReads).toBeGreaterThan(1);
  });

  it('refuses a payment above the total before creating anything', async () => {
    let created = false;
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/dashboard', () => HttpResponse.json(dashboard)),
      http.get('/api/clients', () =>
        HttpResponse.json([{ id: 'k1', name: 'Rabe', phone: null, locality: null }]),
      ),
      http.post('/api/campaigns/c1/sales', () => {
        created = true;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    mount();

    await user.click(await screen.findByRole('button', { name: 'Nouvelle vente' }));
    const sheet = await screen.findByRole('dialog', { name: 'Nouvelle vente' });
    await user.click(within(sheet).getByRole('combobox', { name: 'Client' }));
    await user.click(await screen.findByRole('option', { name: 'Rabe' }));
    await user.type(within(sheet).getByLabelText('Quantité (briques)'), '10');
    await user.type(within(sheet).getByLabelText('Prix unitaire (Ar)'), '300');
    const received = within(sheet).getByLabelText('Montant encaissé (Ar)');
    await user.clear(received);
    await user.type(received, '5000');
    await user.click(within(sheet).getByRole('button', { name: 'Enregistrer' }));

    expect(
      await within(sheet).findByText('L’encaissement ne peut pas dépasser le total de la vente.'),
    ).toBeInTheDocument();
    expect(created).toBe(false);
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
