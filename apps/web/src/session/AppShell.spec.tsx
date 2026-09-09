import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { AppShell } from './AppShell.js';

const routes = [
  { path: '/connexion', element: <p>Écran de connexion</p> },
  { path: '/', element: <AppShell />, children: [{ index: true, element: <p>Accueil</p> }] },
];

describe('AppShell', () => {
  it('shows who is signed in and signs them out on request', async () => {
    let loggedOut = false;
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })),
      http.post('/api/auth/logout', () => {
        loggedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderRoutes(routes, '/');
    expect(await screen.findByText('a@b.c')).toBeInTheDocument();
    expect(screen.getByText('Accueil')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(await screen.findByText('Écran de connexion')).toBeInTheDocument();
    expect(loggedOut).toBe(true);
    expect(router.state.location.pathname).toBe('/connexion');
  });
});
