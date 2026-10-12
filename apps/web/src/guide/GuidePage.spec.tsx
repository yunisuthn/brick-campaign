import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoutes } from '../test/render.js';
import { GuidePage } from './GuidePage.js';

const routes = [
  { path: '/guide', element: <GuidePage /> },
  { path: '/lots', element: <p>Écran des lots</p> },
];

describe('GuidePage', () => {
  it('lists every task, folded, in the order of the season', () => {
    renderRoutes(routes, '/guide');

    expect(screen.getByRole('heading', { level: 1, name: 'Guide' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Démarrer une campagne',
      'Ajouter un mouleur, une rizière ou un client',
      'Saisir les briques d’un mouleur',
      'Payer un mouleur ou un prestataire',
      'Enfourner puis défourner un lot',
      'Vendre, livrer, encaisser',
      'Saisir une dépense',
      'Finir la campagne',
      'Corriger ou annuler une saisie',
    ]);
    expect(screen.getByText(/Enfourner un lot/, { selector: 'li span' })).not.toBeVisible();
  });

  it('opens a topic on its steps, the buttons named by their own labels, and leads to its screen', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, '/guide');

    await user.click(screen.getByRole('heading', { name: 'Enfourner puis défourner un lot' }));
    expect(
      screen.getByText(
        'Ouvrez Lots, puis « Enfourner un lot ». Le stock crue disponible s’affiche.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Sur la fiche du lot, « Ajouter une prestation » pour le transport vers le four et l’enfournement.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Seules les briques cuites peuvent être livrées.')).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Ouvrir Lots' }));
    expect(router.state.location.pathname).toBe('/lots');
  });

  it.each(['fr', 'mg'])('leaves no placeholder unfilled in %s', (lang) => {
    localStorage.setItem('lang', lang);
    renderRoutes(routes, '/guide');
    expect(document.body.textContent).not.toMatch(/\{\w+\}/);
  });
});
