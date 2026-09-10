import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewClientPage } from './NewClientPage.js';

const routes = [
  { path: '/clients', element: <p>Liste des clients</p> },
  { path: '/clients/nouveau', element: <NewClientPage /> },
];

describe('NewClientPage', () => {
  it('posts the client, phone left empty as null, and goes back to the list', async () => {
    let body: unknown;
    server.use(
      http.post('/api/clients', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 'c1', ...(body as object) }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/clients/nouveau');

    await user.type(screen.getByLabelText('Nom'), ' Rabe ');
    await user.type(screen.getByLabelText('Localité'), 'Antsirabe');
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));

    expect(await screen.findByText('Liste des clients')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/clients');
    expect(body).toEqual({ name: 'Rabe', phone: null, locality: 'Antsirabe' });
  });

  it('requires a name and a locality', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/clients/nouveau');

    await user.type(screen.getByLabelText('Téléphone'), '034 12 345 67');
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le nom est requis.',
      'La localité est requise.',
    ]);
  });
});
