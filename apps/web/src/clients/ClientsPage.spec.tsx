import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { ClientsPage } from './ClientsPage.js';

describe('ClientsPage', () => {
  it('lists the clients with their locality and phone when known', async () => {
    server.use(
      http.get('/api/clients', () =>
        HttpResponse.json([
          { id: 'c1', name: 'Rabe', phone: '034 12 345 67', locality: 'Antsirabe' },
          { id: 'c2', name: 'Vola', phone: null, locality: 'Betafo' },
        ]),
      ),
    );
    renderWithProviders(<ClientsPage />);

    expect(await screen.findByRole('link', { name: 'Rabe' })).toHaveAttribute(
      'href',
      '/clients/c1',
    );
    expect(screen.getByText('Antsirabe · 034 12 345 67')).toBeInTheDocument();
    expect(screen.getByText('Betafo')).toBeInTheDocument();
  });

  it('says so when there is no client yet', async () => {
    server.use(http.get('/api/clients', () => HttpResponse.json([])));
    renderWithProviders(<ClientsPage />);
    expect(await screen.findByText('Aucun client.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nouveau client' })).toHaveAttribute(
      'href',
      '/clients/nouveau',
    );
  });
});
