import { http, HttpResponse } from 'msw';
import { api, ApiError } from './api/client.js';
import { createQueryClient } from './queryClient.js';
import { SESSION_KEY } from './session/keys.js';
import { server } from './test/server.js';

describe('createQueryClient', () => {
  it('never retries a 4xx, retries a network failure or a 5xx once', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry;
    expect(retry).toBeTypeOf('function');
    if (typeof retry !== 'function') return;
    expect(retry(0, new ApiError(401, 'Unauthorized'))).toBe(false);
    expect(retry(0, new ApiError(503, 'down'))).toBe(true);
    expect(retry(1, new ApiError(503, 'down'))).toBe(false);
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('marks the session out on a 401 from any query or mutation, and only then', async () => {
    server.use(
      http.get('/api/things', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
      http.post('/api/things', () => HttpResponse.json({ message: 'Bad' }, { status: 400 })),
    );
    const client = createQueryClient();
    client.setQueryData(SESSION_KEY, { id: 'u1', email: 'a@b.c' });

    await client
      .fetchQuery({ queryKey: ['things'], queryFn: () => api.get('/things'), retry: false })
      .catch(() => undefined);
    expect(client.getQueryData(SESSION_KEY)).toBeNull();

    client.setQueryData(SESSION_KEY, { id: 'u1', email: 'a@b.c' });
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => api.post('/things') })
      .execute(undefined)
      .catch(() => undefined);
    expect(client.getQueryData(SESSION_KEY)).toEqual({ id: 'u1', email: 'a@b.c' });
  });
});
