import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { MouldersPage } from './MouldersPage.js';

const rakoto = { id: 'm1', name: 'Rakoto', memberCount: 3, active: true };
const solo = { id: 'm2', name: 'Solo', memberCount: 1, active: false };

describe('MouldersPage', () => {
  it('lists active moulders, and the retired ones on request', async () => {
    server.use(
      http.get('/api/moulders', ({ request }) => {
        const all = new URL(request.url).searchParams.get('includeInactive') === 'true';
        return HttpResponse.json(all ? [rakoto, solo] : [rakoto]);
      }),
    );
    renderWithProviders(<MouldersPage />);

    expect(await screen.findByRole('link', { name: 'Rakoto' })).toHaveAttribute(
      'href',
      '/mouleurs/m1',
    );
    expect(screen.getByText('3 membres')).toBeInTheDocument();
    expect(screen.queryByText('Solo')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Afficher les mouleurs retirés'));
    expect(await screen.findByRole('link', { name: 'Solo' })).toBeInTheDocument();
    expect(screen.getByText('1 membre · retiré')).toBeInTheDocument();
  });

  it('says so when there is no moulder yet', async () => {
    server.use(http.get('/api/moulders', () => HttpResponse.json([])));
    renderWithProviders(<MouldersPage />);
    expect(await screen.findByText('Aucun mouleur.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nouveau mouleur' })).toHaveAttribute(
      'href',
      '/mouleurs/nouveau',
    );
  });
});
