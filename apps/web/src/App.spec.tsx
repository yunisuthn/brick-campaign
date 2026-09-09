import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { App } from './App.js';
import { server } from './test/server.js';

describe('App', () => {
  it('reports the API as available when health answers ok', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'ok', database: 'up' })));
    render(<App />);
    expect(await screen.findByRole('status')).toHaveTextContent('API disponible.');
  });

  it('reports the API as unavailable with its message otherwise', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json({ status: 'error', message: 'database down' }, { status: 503 }),
      ),
    );
    render(<App />);
    expect(await screen.findByRole('status')).toHaveTextContent('API indisponible : database down');
  });
});
