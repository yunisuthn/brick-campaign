import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { ClientPage } from './ClientPage.js';

const routes = [{ path: '/clients/:id', element: <ClientPage /> }];
const rabe = { id: 'c1', name: 'Rabe', phone: null, locality: 'Antsirabe' };

describe('ClientPage', () => {
  it('edits the client and sends every field back', async () => {
    let body: unknown;
    server.use(
      http.get('/api/clients/c1', () => HttpResponse.json(rabe)),
      http.patch('/api/clients/c1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...rabe, ...(body as object) });
      }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, '/clients/c1');

    const phone = await screen.findByLabelText('Téléphone');
    expect(phone).toHaveValue('');
    await user.type(phone, '034 12 345 67');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByRole('button', { name: 'Enregistrer' });
    expect(body).toEqual({ name: 'Rabe', phone: '034 12 345 67', locality: 'Antsirabe' });
  });

  it('says the client is not found on a 404', async () => {
    server.use(
      http.get('/api/clients/nope', () =>
        HttpResponse.json({ message: 'Client nope not found' }, { status: 404 }),
      ),
    );
    renderRoutes(routes, '/clients/nope');
    expect(await screen.findByRole('alert')).toHaveTextContent('Client introuvable.');
  });
});
