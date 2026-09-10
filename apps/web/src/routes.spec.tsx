import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { routes } from './routes.js';
import { renderRoutes } from './test/render.js';
import { server } from './test/server.js';

describe('routes', () => {
  it('sends / to the campaigns inside the shell once signed in', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/campaigns', () => HttpResponse.json([])),
    );
    const { router } = renderRoutes(routes, '/');
    expect(await screen.findByText('Aucune campagne.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/campagnes');
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
