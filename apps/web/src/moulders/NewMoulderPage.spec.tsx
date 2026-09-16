import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewMoulderPage } from './NewMoulderPage.js';

const routes = [
  { path: '/mouleurs', element: <p>Liste des mouleurs</p> },
  { path: '/mouleurs/nouveau', element: <NewMoulderPage /> },
];

describe('NewMoulderPage', () => {
  it('posts the trimmed name with one member by default and goes back to the list', async () => {
    let body: unknown;
    server.use(
      http.post('/api/moulders', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 'm1', active: true, ...(body as object) }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/mouleurs/nouveau');

    expect(screen.getByLabelText('Nombre de membres')).toHaveValue('1');
    await user.type(screen.getByLabelText('Nom du responsable'), '  Rakoto ');
    await user.click(screen.getByRole('button', { name: 'Créer le mouleur' }));

    expect(await screen.findByText('Liste des mouleurs')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/mouleurs');
    expect(body).toEqual({ name: 'Rakoto', memberCount: 1 });
  });

  it('requires a name and a member count between 1 and 20', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/mouleurs/nouveau');

    await user.clear(screen.getByLabelText('Nombre de membres'));
    await user.type(screen.getByLabelText('Nombre de membres'), '25');
    await user.click(screen.getByRole('button', { name: 'Créer le mouleur' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le nom est requis.',
      'Un nombre entre 1 et 20 est attendu.',
    ]);
  });
});
