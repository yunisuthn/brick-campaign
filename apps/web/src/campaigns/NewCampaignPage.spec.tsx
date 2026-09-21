import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderRoutes } from '../test/render.js';
import { server } from '../test/server.js';
import { NewCampaignPage } from './NewCampaignPage.js';

const routes = [
  { path: '/campagnes/:id', element: <p>Fiche de la campagne</p> },
  { path: '/campagnes/nouvelle', element: <NewCampaignPage /> },
];

async function addPrice(user: ReturnType<typeof userEvent.setup>, legend: string, price: string) {
  const fieldset = within(screen.getByRole('group', { name: new RegExp(legend) }));
  await user.type(fieldset.getByRole('spinbutton'), price);
  await user.click(fieldset.getByRole('button', { name: 'Ajouter' }));
}

async function fillForm() {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Année'));
  await user.type(screen.getByLabelText('Année'), '2026');
  await user.type(screen.getByLabelText('Date de début'), '10/05/2026');
  await addPrice(user, 'Moulage', '40');
  await addPrice(user, 'Transport', '10');
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
      tranche: 1,
      startedOn: '2026-05-10',
      mouldingRates: [40],
      transportRates: [10],
      kilnLoadingRate: null,
    });
  });

  it('names the year and tranche when the API answers that it already has a campaign', async () => {
    server.use(
      http.post('/api/campaigns', () =>
        HttpResponse.json(
          {
            code: 'campaign_year_tranche_taken',
            message: 'A campaign for 2026 tranche 1 already exists',
            details: { year: 2026, tranche: 1 },
          },
          { status: 409 },
        ),
      ),
    );
    renderRoutes(routes, '/campagnes/nouvelle');

    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: 'Créer la campagne' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Création impossible : La tranche 1 de 2026 existe déjà.',
    );
  });

  it('never adds a negative or fractional price to a list', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/nouvelle');

    await addPrice(user, 'Moulage', '-3');
    const moulding = within(screen.getByRole('group', { name: /Moulage/ }));
    expect(moulding.getByText('Aucun prix fixé pour l’instant.')).toBeInTheDocument();
  });

  it('keeps an incomplete form on the screen without calling the API', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, '/campagnes/nouvelle');

    await addPrice(user, 'Moulage', '40');
    await user.click(screen.getByRole('button', { name: 'Créer la campagne' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toEqual(['La date de début est requise.']);
    expect(screen.getByRole('heading', { name: 'Nouvelle campagne' })).toBeInTheDocument();
  });
});
