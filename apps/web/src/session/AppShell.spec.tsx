import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { AppShell } from './AppShell.js';

const routes = [
  { path: '/connexion', element: <p>Écran de connexion</p> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <p>Contenu de la page d’accueil</p> },
      { path: 'ventes', element: <p>Contenu des ventes</p> },
    ],
  },
];

const base = {
  tranche: 1,
  startedOn: '2026-05-10',
  mouldingRates: [40],
  transportRates: [10],
  kilnLoadingRate: 5,
};
const open2026 = { ...base, id: 'c2', year: 2026, closedOn: null };
const closed2025 = { ...base, id: 'c1', year: 2025, closedOn: '2025-11-30' };

describe('AppShell', () => {
  it('shows who is signed in and signs them out on request', async () => {
    let loggedOut = false;
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
      http.post('/api/auth/logout', () => {
        loggedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderRoutes(routes, '/');
    expect(await screen.findByText('a@b.c')).toBeInTheDocument();
    expect(screen.getByText('Contenu de la page d’accueil')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(await screen.findByText('Écran de connexion')).toBeInTheDocument();
    expect(loggedOut).toBe(true);
    expect(router.state.location.pathname).toBe('/connexion');
  });

  it('lets the current campaign be picked among all of them, closed ones marked', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([open2026, closed2025])),
    );
    renderRoutes(routes, '/');

    const nav = await screen.findByRole('navigation', { name: 'Campagne courante' });
    await within(nav).findByText('2026 · Tranche 1');
    const picker = within(nav).getByRole('button');

    await userEvent.click(picker);
    expect(screen.getByRole('option', { name: '2025 · Tranche 1 (clôturée)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: '2025 · Tranche 1 (clôturée)' }));

    expect(picker).toHaveTextContent('2025 · Tranche 1 (clôturée)');
    expect(localStorage.getItem('currentCampaignId')).toBe('c1');
  });

  it('offers the four bottom-bar destinations, the current one marked, and navigates', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
    );
    const { router } = renderRoutes(routes, '/');
    await screen.findByText('Contenu de la page d’accueil');

    const bar = screen.getByRole('navigation', { name: 'Navigation' });
    const links = within(bar).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Accueil',
      'Productions',
      'Ventes',
      'Plus',
    ]);
    expect(within(bar).getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(within(bar).getByRole('link', { name: 'Ventes' }));
    expect(await screen.findByText('Contenu des ventes')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ventes');
  });

  it('disables the picker while there is no campaign', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
    );
    renderRoutes(routes, '/');

    const nav = await screen.findByRole('navigation', { name: 'Campagne courante' });
    const picker = within(nav).getByRole('button');
    expect(picker).toBeDisabled();
    expect(picker).toHaveTextContent('Aucune');
  });
});
