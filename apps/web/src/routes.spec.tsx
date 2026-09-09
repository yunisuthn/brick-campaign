import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { routes } from './routes.js';
import { renderRoutes } from './test/render.js';
import { server } from './test/server.js';

describe('routes', () => {
  it('serves the home page at / inside the shell once signed in', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.get('/api/health', () => HttpResponse.json({ status: 'ok', database: 'up' })),
    );
    renderRoutes(routes, '/');
    expect(await screen.findByText('API disponible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
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
