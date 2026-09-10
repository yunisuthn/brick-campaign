import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewCampaignPage } from './NewCampaignPage.js';

const routes = [
  { path: '/campagnes/:id', element: <p>Fiche de la campagne</p> },
  { path: '/campagnes/nouvelle', element: <NewCampaignPage /> },
];

async function fillForm() {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Année'));
  await user.type(screen.getByLabelText('Année'), '2026');
  await user.type(screen.getByLabelText('Date de début'), '2026-05-10');
  await user.type(screen.getByLabelText('Moulage (Ar la brique)'), '40');
  await user.type(screen.getByLabelText('Transport (Ar la brique)'), '10');
  // Kiln loading left empty: still under discussion.
  return user;
}

describe('NewCampaignPage', () => {
  it('posts the campaign as the API expects it and opens its page', async () => {
    let body: unknown;
    server.use(
      http.post('/api/campaigns', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'c1', closedOn: null, ...(body as object) },
          { status: 201 },
        );
      }),
    );
    const { router } = renderRoutes(routes, '/campagnes/nouvelle');

    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Créer la campagne' }));

    expect(await screen.findByText('Fiche de la campagne')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/campagnes/c1');
    expect(body).toEqual({
      year: 2026,
      startedOn: '2026-05-10',
      mouldingRate: 40,
      transportRate: 10,
      kilnLoadingRate: null,
    });
  });

  it('names the year when the API answers that it already has a campaign', async () => {
    server.use(
      http.post('/api/campaigns', () =>
        HttpResponse.json({ message: 'A campaign for 2026 already exists' }, { status: 409 }),
      ),
    );
    renderRoutes(routes, '/campagnes/nouvelle');

    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Créer la campagne' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Une campagne existe déjà pour 2026.',
    );
  });

  it('keeps an incomplete or malformed form on the screen without calling the API', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/nouvelle');

    await user.type(screen.getByLabelText('Moulage (Ar la brique)'), '-3');
    await user.click(screen.getByRole('button', { name: 'Créer la campagne' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'La date de début est requise.',
      'Un nombre entier positif est attendu, ou rien tant que le tarif n’est pas fixé.',
    ]);
    expect(screen.getByRole('heading', { name: 'Nouvelle campagne' })).toBeInTheDocument();
  });
});
