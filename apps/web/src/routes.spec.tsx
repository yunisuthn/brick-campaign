import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { routes } from './routes.js';
import { renderRoutes } from './test/render.js';
import { server } from './test/server.js';

describe('routes', () => {
  it('serves the home page at /', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'ok', database: 'up' })));
    renderRoutes(routes, '/');
    expect(await screen.findByRole('heading', { name: 'Briqueterie' })).toBeInTheDocument();
  });
});
