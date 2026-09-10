import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { routes } from './routes.js';
import { renderRoutes } from './test/render.js';
import { server } from './test/server.js';

describe('routes', () => {
  it('opens on the dashboard inside the shell once signed in', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
    );
    const { router } = renderRoutes(routes, '/');
    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('reaches the moulders from the section links', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
      http.get('/api/moulders', () => HttpResponse.json([])),
    );
    const { router } = renderRoutes(routes, '/campagnes');
    await userEvent.click(await screen.findByRole('link', { name: 'Mouleurs' }));
    expect(await screen.findByText('Aucun mouleur.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/mouleurs');
  });

  it('sends a signed-out visitor from / to the login screen', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );
    renderRoutes(routes, '/');
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
  });
});
