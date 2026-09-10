import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { BatchWorks } from './BatchWorks.js';

describe('BatchWorks', () => {
  it('lists the works of the batch it is given, asking the API for that batch only', async () => {
    let search = '';
    server.use(
      http.get('/api/campaigns/c1/contractor-works', ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json([
          {
            id: 'w1',
            campaignId: 'c1',
            kilnBatchId: 'b1',
            type: 'transport',
            contractorName: 'Solo',
            date: '2026-06-02',
            quantity: 40000,
          },
        ]);
      }),
    );
    renderWithProviders(<BatchWorks campaignId="c1" batchId="b1" />);

    expect(await screen.findByRole('link', { name: 'Solo' })).toHaveAttribute(
      'href',
      '/prestations/w1',
    );
    expect(
      screen.getByText('Transport vers le four · 2 juin 2026 · 40 000 briques'),
    ).toBeInTheDocument();
    expect(search).toBe('?kilnBatchId=b1');
  });

  it('says so when the batch carries no work yet', async () => {
    server.use(http.get('/api/campaigns/c1/contractor-works', () => HttpResponse.json([])));
    renderWithProviders(<BatchWorks campaignId="c1" batchId="b1" />);

    expect(await screen.findByText('Aucune prestation sur ce lot.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ajouter une prestation' })).toHaveAttribute(
      'href',
      '/lots/b1/prestations/nouvelle',
    );
  });
});
