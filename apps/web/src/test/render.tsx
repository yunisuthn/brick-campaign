import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, type RouteObject, RouterProvider } from 'react-router';
import { createQueryClient } from '../queryClient.js';

/** The production client, minus retries: a test asserts on the first answer, not a second try. */
function testQueryClient() {
  const client = createQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  return client;
}

/** Mounts route objects at `path` in a memory router, with a fresh query cache per test. */
export function renderRoutes(routes: RouteObject[], path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <QueryClientProvider client={testQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router };
}

/** Mounts one element as the whole page at `path`: what a screen test needs. */
export function renderWithProviders(ui: ReactElement, path = '/') {
  return renderRoutes([{ path: '*', element: ui }], path);
}
