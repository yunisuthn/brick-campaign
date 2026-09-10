import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { MoulderPage } from './MoulderPage.js';

const routes = [{ path: '/mouleurs/:id', element: <MoulderPage /> }];
const rakoto = { id: 'm1', name: 'Rakoto', memberCount: 3, active: true };

describe('MoulderPage', () => {
  it('edits the name and the member count', async () => {
    let body: unknown;
    server.use(
      http.get('/api/moulders/m1', () => HttpResponse.json(rakoto)),
      http.patch('/api/moulders/m1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...rakoto, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/mouleurs/m1');

    const name = await screen.findByLabelText('Nom du responsable');
    expect(name).toHaveValue('Rakoto');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await user.clear(name);
    await user.type(name, 'Rakotobe');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('heading', { name: 'Rakotobe' })).toBeInTheDocument();
    expect(body).toEqual({ name: 'Rakotobe', memberCount: 3 });
  });

  it('retires a moulder and can bring them back', async () => {
    let active = true;
    server.use(
      http.get('/api/moulders/m1', () => HttpResponse.json({ ...rakoto, active })),
      http.patch('/api/moulders/m1', async ({ request }) => {
        const body = (await request.json()) as { active: boolean };
        active = body.active;
        return HttpResponse.json({ ...rakoto, active });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/mouleurs/m1');

    await user.click(await screen.findByRole('button', { name: 'Retirer le mouleur' }));
    expect(await screen.findByRole('button', { name: 'Réactiver le mouleur' })).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('Rakoto · retiré');

    await user.click(screen.getByRole('button', { name: 'Réactiver le mouleur' }));
    expect(await screen.findByRole('button', { name: 'Retirer le mouleur' })).toBeInTheDocument();
    expect(active).toBe(true);
  });

  it('says the moulder is not found on a 404', async () => {
    server.use(
      http.get('/api/moulders/nope', () =>
        HttpResponse.json({ message: 'Moulder nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/mouleurs/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Mouleur introuvable.');
  });
});
