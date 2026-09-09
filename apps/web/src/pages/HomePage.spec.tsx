import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/render.js';
import { server } from '../test/server.js';
import { HomePage } from './HomePage.js';

describe('HomePage', () => {
  it('reports the API as available when health answers ok', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'ok', database: 'up' })));
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('API disponible.')).toBeInTheDocument();
  });

  it('reports the API as unavailable with its message otherwise', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json({ status: 'error', message: 'database down' }, { status: 503 }),
      ),
    );
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('API indisponible : database down')).toBeInTheDocument();
  });
});
