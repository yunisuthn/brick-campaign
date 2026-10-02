import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { BalancesPage } from './BalancesPage.js';

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
const noPayments = { vatsy: 0, advance: 0, settlement: 0 };

function mount() {
  renderWithProviders(
    <CurrentCampaignProvider>
      <BalancesPage />
    </CurrentCampaignProvider>,
  );
}

describe('BalancesPage', () => {
  it('tells what each moulder and contractor is owed', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/balances/moulders', () =>
        HttpResponse.json([
          {
            moulderId: 'm1',
            name: 'Rakoto',
            bricks: 2500,
            earned: 100000,
            paid: 25000,
            paidByType: { ...noPayments, vatsy: 25000 },
            due: 75000,
          },
          {
            moulderId: 'm2',
            name: 'Rasoa',
            bricks: 0,
            earned: 0,
            paid: 5000,
            paidByType: { ...noPayments, advance: 5000 },
            due: -5000,
          },
        ]),
      ),
      http.get('/api/campaigns/c1/balances/contractors', () =>
        HttpResponse.json([
          {
            contractorName: 'Solo',
            bricksByType: { transport: 40000, kiln_loading: 0 },
            earned: 400000,
            paid: 100000,
            paidByType: { ...noPayments, advance: 100000 },
            due: 300000,
          },
        ]),
      ),
    );
    mount();

    const moulders = await screen.findByRole('region', { name: 'Mouleurs' });
    // 75 000 owed to Rakoto, netted against 5 000 overpaid to Rasoa.
    expect(within(moulders).getByText('Total reste dû').nextSibling).toHaveTextContent('70 000 Ar');
    const [rakoto, rasoa] = within(moulders).getAllByRole('listitem');
    expect(within(rakoto!).getByText('2 500 briques')).toBeInTheDocument();
    expect(within(rakoto!).getByText('Reste dû')).toBeInTheDocument();
    // Paid more than produced: the label changes rather than showing a negative amount.
    expect(within(rasoa!).getByText('Trop versé')).toBeInTheDocument();

    const contractors = screen.getByRole('region', { name: 'Prestataires' });
    expect(within(contractors).getByText('40 000 briques transportées')).toBeInTheDocument();
  });

  it('says the rate is still to be fixed instead of showing a zero', async () => {
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([{ ...campaign, mouldingRates: [] }])),
      http.get('/api/campaigns/c1/balances/moulders', () =>
        HttpResponse.json([
          {
            moulderId: 'm1',
            name: 'Rakoto',
            bricks: 2500,
            earned: null,
            paid: 25000,
            paidByType: { ...noPayments, vatsy: 25000 },
            due: null,
          },
        ]),
      ),
      http.get('/api/campaigns/c1/balances/contractors', () => HttpResponse.json([])),
    );
    mount();

    // Said both for the one moulder's own earnings and for the total that sums them.
    expect(await screen.findAllByText('Tarif de moulage à fixer')).toHaveLength(2);
    expect(screen.getByText('Inconnu tant que le tarif n’est pas fixé')).toBeInTheDocument();
    expect(
      screen.getByText('Aucune prestation ni versement sur cette campagne.'),
    ).toBeInTheDocument();
  });

  it('pays what a moulder is owed as a settlement, after a confirmation', async () => {
    let due = 75000;
    let sent: unknown;
    server.use(
      http.get('/api/campaigns', () => HttpResponse.json([campaign])),
      http.get('/api/campaigns/c1/balances/moulders', () =>
        HttpResponse.json([
          {
            moulderId: 'm1',
            name: 'Rakoto',
            bricks: 2500,
            earned: 100000,
            paid: 100000 - due,
            paidByType: { ...noPayments, vatsy: 25000, settlement: 75000 - due },
            due,
          },
          {
            moulderId: 'm2',
            name: 'Rasoa',
            bricks: 0,
            earned: 0,
            paid: 5000,
            paidByType: { ...noPayments, advance: 5000 },
            due: -5000,
          },
        ]),
      ),
      http.get('/api/campaigns/c1/balances/contractors', () => HttpResponse.json([])),
      http.post('/api/campaigns/c1/payments', async ({ request }) => {
        sent = await request.json();
        due = 0;
        return HttpResponse.json(
          { id: 'p1', campaignId: 'c1', contractorName: null, ...(sent as object) },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    mount();

    const moulders = await screen.findByRole('region', { name: 'Mouleurs' });
    const [rakoto, rasoa] = within(moulders).getAllByRole('listitem');
    // Nothing to settle for a moulder already overpaid.
    expect(within(rasoa!).queryByRole('button')).not.toBeInTheDocument();

    await user.click(within(rakoto!).getByRole('button', { name: 'Payer le solde' }));
    expect(sent).toBeUndefined();
    await user.click(within(rakoto!).getByRole('button', { name: /^Confirmer 75.000 Ar$/ }));

    expect(sent).toMatchObject({ moulderId: 'm1', type: 'settlement', amount: 75000 });
    // Paid up once the balances come back: the button is gone.
    await waitFor(() => expect(within(rakoto!).queryByRole('button')).not.toBeInTheDocument());
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
