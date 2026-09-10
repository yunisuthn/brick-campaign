import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { RiceFieldsPage } from './RiceFieldsPage.js';

describe('RiceFieldsPage', () => {
  it('lists the rice fields with their location, surface and contract', async () => {
    server.use(
      http.get('/api/rice-fields', () =>
        HttpResponse.json([
          { id: 'r1', name: 'Ambany', location: 'Sud', surfaceM2: 2500, contractType: 'durable' },
          { id: 'r2', name: 'Ambony', location: 'Nord', surfaceM2: null, contractType: 'seasonal' },
        ]),
      ),
    );
    renderWithProviders(<RiceFieldsPage />);

    expect(await screen.findByRole('link', { name: 'Ambany' })).toHaveAttribute(
      'href',
      '/rizieres/r1',
    );
    expect(screen.getByText('Sud · 2500 m² · contrat durable')).toBeInTheDocument();
    expect(
      screen.getByText('Nord · Surface non précisée · contrat de campagne'),
    ).toBeInTheDocument();
  });

  it('says so when there is no rice field yet', async () => {
    server.use(http.get('/api/rice-fields', () => HttpResponse.json([])));
    renderWithProviders(<RiceFieldsPage />);
    expect(await screen.findByText('Aucune rizière.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nouvelle rizière' })).toHaveAttribute(
      'href',
      '/rizieres/nouvelle',
    );
  });
});
