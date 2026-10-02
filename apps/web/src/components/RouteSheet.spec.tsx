import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet } from 'react-router';
import { renderRoutes } from '../test/render.js';
import { RouteSheet, SheetActions } from './RouteSheet.js';

function routes() {
  return [
    {
      path: '/liste',
      element: (
        <>
          <h1>La liste</h1>
          <Outlet />
        </>
      ),
      children: [
        {
          path: 'nouveau',
          element: (
            <RouteSheet title="Nouvelle saisie" closeTo="/liste">
              <form onSubmit={(event) => event.preventDefault()}>
                <SheetActions submitLabel="Enregistrer" />
              </form>
            </RouteSheet>
          ),
        },
      ],
    },
  ];
}

describe('RouteSheet', () => {
  it('opens over the list for as long as its route is the current one', async () => {
    renderRoutes(routes(), '/liste/nouveau');
    expect(await screen.findByRole('dialog', { name: 'Nouvelle saisie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'La liste', hidden: true })).toBeInTheDocument();
  });

  it('goes back to the list when closed by its cross', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes(), '/liste/nouveau');
    await user.click(await screen.findByRole('button', { name: 'Fermer' }));
    expect(router.state.location.pathname).toBe('/liste');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('goes back to the list when cancelled', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes(), '/liste/nouveau');
    await user.click(await screen.findByRole('button', { name: 'Annuler' }));
    expect(router.state.location.pathname).toBe('/liste');
  });
});
