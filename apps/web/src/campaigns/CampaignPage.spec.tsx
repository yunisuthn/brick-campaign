import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { today } from '../format.js';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { CampaignPage } from './CampaignPage.js';

const routes = [{ path: '/campagnes/:id', element: <CampaignPage /> }];

const open = {
  id: 'c1',
  year: 2026,
  startedOn: '2026-05-10',
  closedOn: null,
  mouldingRate: 40,
  transportRate: 10,
  kilnLoadingRate: 5,
};

describe('CampaignPage', () => {
  it('shows the campaign the URL names', async () => {
    server.use(http.get('/api/campaigns/c1', () => HttpResponse.json(open)));
    renderRoutes(routes, '/campagnes/c1');

    expect(await screen.findByRole('heading', { name: 'Campagne 2026' })).toBeInTheDocument();
    expect(screen.getByText('Ouverte depuis le 10 mai 2026')).toBeInTheDocument();
    expect(screen.getByText('5 Ar la brique')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Toutes les campagnes' })).toHaveAttribute(
      'href',
      '/campagnes',
    );
  });

  it('says the campaign is not found on a 404', async () => {
    server.use(
      http.get('/api/campaigns/nope', () =>
        HttpResponse.json({ message: 'Campaign nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/campagnes/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Campagne introuvable.');
  });

  it('closes an open campaign on the chosen date and shows it closed', async () => {
    let body: unknown;
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json(open)),
      http.patch('/api/campaigns/c1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...open, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/c1');

    await user.click(await screen.findByRole('button', { name: 'Clôturer la campagne' }));
    const date = screen.getByLabelText('Date de clôture');
    expect(date).toHaveValue(today());
    await user.clear(date);
    await user.type(date, '2026-11-30');
    await user.click(screen.getByRole('button', { name: 'Confirmer la clôture' }));

    expect(await screen.findByText('Clôturée le 30 novembre 2026')).toBeInTheDocument();
    expect(body).toEqual({ closedOn: '2026-11-30' });
    expect(screen.queryByRole('button', { name: 'Clôturer la campagne' })).not.toBeInTheDocument();
  });

  it('shows the API message when the closing date is refused', async () => {
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json(open)),
      http.patch('/api/campaigns/c1', () =>
        HttpResponse.json({ message: 'closedOn must not be before startedOn' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/c1');

    await user.click(await screen.findByRole('button', { name: 'Clôturer la campagne' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la clôture' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Clôture impossible : closedOn must not be before startedOn',
    );
    expect(screen.getByText('Ouverte depuis le 10 mai 2026')).toBeInTheDocument();
  });

  it('shows a rate still to be fixed and lets the rates be set from the page', async () => {
    let body: unknown;
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json({ ...open, mouldingRate: null })),
      http.patch('/api/campaigns/c1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...open, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/c1');

    expect(await screen.findByText('À fixer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Modifier les tarifs' }));
    const moulding = screen.getByLabelText('Moulage (Ar la brique)');
    expect(moulding).toHaveValue('');
    expect(screen.getByLabelText('Transport (Ar la brique)')).toHaveValue('10');
    await user.type(moulding, '40');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les tarifs' }));

    expect(await screen.findByText('40 Ar la brique')).toBeInTheDocument();
    expect(body).toEqual({ mouldingRate: 40, transportRate: 10, kilnLoadingRate: 5 });
    expect(screen.queryByRole('form', { name: 'Tarifs de la campagne' })).not.toBeInTheDocument();
  });

  it('offers no closing on a campaign already closed', async () => {
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json({ ...open, closedOn: '2026-11-30' })),
    );
    renderRoutes(routes, '/campagnes/c1');

    expect(await screen.findByText('Clôturée le 30 novembre 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clôturer la campagne' })).not.toBeInTheDocument();
  });
});
