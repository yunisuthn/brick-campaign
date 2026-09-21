import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { chooseOption } from '../test/select.js';
import { server } from '../test/server.js';
import { NewRiceFieldPage } from './NewRiceFieldPage.js';

const routes = [
  { path: '/rizieres', element: <p>Liste des rizières</p> },
  { path: '/rizieres/nouvelle', element: <NewRiceFieldPage /> },
];

describe('NewRiceFieldPage', () => {
  it('posts the rice field, surface left empty as null, and goes back to the list', async () => {
    let body: unknown;
    server.use(
      http.post('/api/rice-fields', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 'r1', ...(body as object) }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/rizieres/nouvelle');

    await user.type(screen.getByLabelText('Nom'), 'Ambany');
    await user.type(screen.getByLabelText('Localisation'), 'Sud');
    await chooseOption(user, 'Type de contrat', 'Durable');
    await user.click(screen.getByRole('button', { name: 'Créer la rizière' }));

    expect(await screen.findByText('Liste des rizières')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/rizieres');
    expect(body).toEqual({
      name: 'Ambany',
      location: 'Sud',
      surfaceM2: null,
      contractType: 'durable',
    });
  });

  it('requires a name and a location', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/rizieres/nouvelle');

    await user.click(screen.getByRole('button', { name: 'Créer la rizière' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Le nom est requis.',
      'La localisation est requise.',
    ]);
  });

  it('keeps only digits typed into the surface, dropping the rest as they are typed', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/rizieres/nouvelle');

    await user.type(screen.getByLabelText('Surface (m²)'), '12.5 m²');

    expect(screen.getByLabelText('Surface (m²)')).toHaveValue('125');
  });
});
