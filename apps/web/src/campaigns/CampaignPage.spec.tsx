import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { isoToFrench } from '../form/dateMask.js';
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
  mouldingRates: [40],
  transportRates: [10],
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
    expect(date).toHaveValue(isoToFrench(today()));
    await user.clear(date);
    await user.type(date, '30/11/2026');
    await user.click(screen.getByRole('button', { name: 'Confirmer la clôture' }));

    expect(await screen.findByText('Clôturée le 30 novembre 2026')).toBeInTheDocument();
    expect(body).toEqual({ closedOn: '2026-11-30' });
    expect(screen.queryByRole('button', { name: 'Clôturer la campagne' })).not.toBeInTheDocument();
  });

  it('says in French why the closing date is refused', async () => {
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json(open)),
      http.patch('/api/campaigns/c1', () =>
        HttpResponse.json(
          {
            code: 'campaign_dates_out_of_order',
            message: 'closedOn must not be before startedOn',
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/c1');

    await user.click(await screen.findByRole('button', { name: 'Clôturer la campagne' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la clôture' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Clôture impossible : La clôture ne peut pas précéder le début de la campagne.',
    );
    expect(screen.getByText('Ouverte depuis le 10 mai 2026')).toBeInTheDocument();
  });

  it('shows a rate still to be fixed and lets the rates be set from the page', async () => {
    let body: unknown;
    server.use(
      http.get('/api/campaigns/c1', () => HttpResponse.json({ ...open, mouldingRates: [] })),
      http.patch('/api/campaigns/c1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...open, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/c1');

    expect(await screen.findByText('À fixer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Modifier les tarifs' }));
    const moulding = within(screen.getByRole('group', { name: /Moulage/ }));
    expect(moulding.getByText('Aucun prix fixé pour l’instant.')).toBeInTheDocument();
    const transport = within(screen.getByRole('group', { name: /Transport/ }));
    expect(transport.getByRole('listitem')).toHaveTextContent('10');

    await user.type(moulding.getByRole('spinbutton'), '40');
    await user.click(moulding.getByRole('button', { name: 'Ajouter' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer les tarifs' }));

    expect(await screen.findByText('40 Ar la brique')).toBeInTheDocument();
    expect(body).toEqual({ mouldingRates: [40], transportRates: [10], kilnLoadingRate: 5 });
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
