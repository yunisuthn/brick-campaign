import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { plain } from '../test/text.js';
import { SaleDeliveries } from './SaleDeliveries.js';

describe('SaleDeliveries', () => {
  it('lists the trips of the sale with their cost and plate', async () => {
    server.use(
      http.get('/api/campaigns/c1/sales/s1/deliveries', () =>
        HttpResponse.json([
          {
            id: 'd1',
            saleId: 's1',
            date: '2026-08-05',
            quantity: 2500,
            cost: 60000,
            plate: '1234 TBA',
          },
          { id: 'd2', saleId: 's1', date: '2026-08-06', quantity: 2400, cost: 0, plate: null },
        ]),
      ),
    );
    renderWithProviders(<SaleDeliveries campaignId="c1" saleId="s1" />);

    // A role's name is matched as it is, without the whitespace normalising getByText does.
    const trip = await screen.findByRole('link', {
      name: (name) => plain(name) === '2 500 briques',
    });
    expect(trip).toHaveAttribute('href', '/ventes/s1/livraisons/d1');
    expect(screen.getByText('5 août 2026 · 60 000 Ar · 1234 TBA')).toBeInTheDocument();
    expect(screen.getByText('6 août 2026 · 0 Ar')).toBeInTheDocument();
  });

  it('says so when no trip has been made yet', async () => {
    server.use(http.get('/api/campaigns/c1/sales/s1/deliveries', () => HttpResponse.json([])));
    renderWithProviders(<SaleDeliveries campaignId="c1" saleId="s1" />);

    expect(await screen.findByText('Aucun voyage effectué.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ajouter un voyage' })).toHaveAttribute(
      'href',
      '/ventes/s1/livraisons/nouvelle',
    );
  });
});
