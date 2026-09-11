import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CurrentCampaignProvider } from '../campaigns/currentCampaign.js';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewKilnBatchPage } from './NewKilnBatchPage.js';

const campaign = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

function Page() {
  return (
    <CurrentCampaignProvider>
      <NewKilnBatchPage />
    </CurrentCampaignProvider>
  );
}

const routes = [
  { path: '/lots/nouveau', element: <Page /> },
  { path: '/lots/:id', element: <p>Fiche du lot</p> },
];

let stockReads = 0;

beforeEach(() => {
  stockReads = 0;
});

function stockHandlers(raw: number) {
  return [
    http.get('/api/campaigns', () => HttpResponse.json([campaign])),
    http.get('/api/campaigns/c1/stock', () => {
      stockReads += 1;
      return HttpResponse.json({
        campaignId: 'c1',
        produced: raw,
        loaded: 0,
        unloaded: 0,
        delivered: 0,
        raw,
        inKiln: 0,
        fired: 0,
      });
    }),
  ];
}

describe('NewKilnBatchPage', () => {
  it('tells the raw stock and loads a batch, then opens it', async () => {
    let body: unknown;
    server.use(
      ...stockHandlers(50000),
      http.post('/api/campaigns/c1/kiln-batches', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: 'b1',
            campaignId: 'c1',
            cost: { expenses: 0, labour: 0, total: 0 },
            ...(body as object),
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/lots/nouveau');

    expect(await screen.findByText('Stock crue : 50 000 briques.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Quantité (briques)'), '40000');
    await user.click(screen.getByRole('button', { name: 'Enfourner' }));

    expect(await screen.findByText('Fiche du lot')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/lots/b1');
    expect(body).toEqual({ loadedOn: today(), unloadedOn: null, quantity: 40000 });
    // Loading takes bricks out of the raw stock, so the figure is read again.
    await waitFor(() => expect(stockReads).toBe(2));
  });

  it('refuses a batch under the minimum without calling the API', async () => {
    server.use(...stockHandlers(50000));
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/nouveau');

    await user.type(await screen.findByLabelText('Quantité (briques)'), '39999');
    await user.click(screen.getByRole('button', { name: 'Enfourner' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un lot est de 40 000 briques au minimum.',
    );
  });

  it('shows the API refusal when the raw stock does not cover the batch', async () => {
    server.use(
      ...stockHandlers(10000),
      http.post('/api/campaigns/c1/kiln-batches', () =>
        HttpResponse.json(
          {
            code: 'raw_stock_too_low',
            message: 'Only 10000 raw bricks in stock, cannot load 40000',
            details: { available: 10000, quantity: 40000 },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/lots/nouveau');

    await user.type(await screen.findByLabelText('Quantité (briques)'), '40000');
    await user.click(screen.getByRole('button', { name: 'Enfourner' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enfournement impossible : Il ne reste que 10 000 briques crues en stock, impossible d’en enfourner 40 000.',
    );
  });
});
