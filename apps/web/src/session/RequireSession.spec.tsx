import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { RequireSession } from './RequireSession.js';

const routes = [
  { path: '/connexion', element: <p>Écran de connexion</p> },
  {
    element: <RequireSession />,
    children: [{ path: '/ventes', element: <p>Écran protégé</p> }],
  },
];

describe('RequireSession', () => {
  it('renders the child once /auth/me answers a user', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })));
    renderRoutes(routes, '/ventes');
    expect(screen.getByRole('heading', { name: 'Briqueterie' })).toBeInTheDocument();
    expect(await screen.findByText('Écran protégé')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to the login screen, remembering where they were going', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );
    const { router } = renderRoutes(routes, '/ventes');
    expect(await screen.findByText('Écran de connexion')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/connexion');
    expect(router.state.location.state).toEqual({ from: '/ventes' });
  });

  it('shows the API error instead of the login screen when /auth/me fails for another reason', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ message: 'database down' }, { status: 503 }),
      ),
    );
    renderRoutes(routes, '/ventes');
    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponible : database down');
  });
});
