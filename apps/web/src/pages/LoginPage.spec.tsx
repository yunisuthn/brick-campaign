import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { LoginPage } from './LoginPage.js';

const routes = [
  { path: '/connexion', element: <LoginPage /> },
  { path: '/', element: <p>Accueil</p> },
  { path: '/ventes', element: <p>Ventes</p> },
];

function signedOut() {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
  );
}

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Mot de passe'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
}

describe('LoginPage', () => {
  it('signs in and goes back to where the guard came from', async () => {
    signedOut();
    let sent: unknown;
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: 'u1', email: 'a@b.c' });
      }),
    );
    const { router } = renderRoutes(routes, '/connexion');
    router.navigate('/connexion', { state: { from: '/ventes' }, replace: true });
    await fillAndSubmit('a@b.c', 'secret');
    expect(await screen.findByText('Ventes')).toBeInTheDocument();
    expect(sent).toEqual({ email: 'a@b.c', password: 'secret' });
  });

  it('tells a wrong email or password apart from an API failure', async () => {
    signedOut();
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );
    renderRoutes(routes, '/connexion');
    await fillAndSubmit('a@b.c', 'wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');

    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ message: 'database down' }, { status: 503 }),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('Connexion impossible : database down')).toBeInTheDocument();
  });

  it('asks for the missing field before calling the API', async () => {
    signedOut();
    renderRoutes(routes, '/connexion');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('L’email est requis.');
  });

  it('sends someone already signed in straight to the home page', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'a@b.c' })));
    renderRoutes(routes, '/connexion');
    expect(await screen.findByText('Accueil')).toBeInTheDocument();
  });
});
