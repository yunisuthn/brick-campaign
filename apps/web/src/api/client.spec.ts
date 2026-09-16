import { http, HttpResponse } from 'msw';
import { server } from '../test/server.js';
import { api, ApiError } from './client.js';

describe('api', () => {
  it('prefixes the path, sends the cookie along and parses JSON', async () => {
    let credentials: RequestCredentials | undefined;
    server.use(
      http.get('/api/health', ({ request }) => {
        credentials = request.credentials;
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    await expect(api.get('/health')).resolves.toEqual({ status: 'ok' });
    expect(credentials).toBe('same-origin');
  });

  it('sends a JSON body on post and patch', async () => {
    let received: { method: string; type: string | null; body: unknown } | undefined;
    server.use(
      http.all('/api/things', async ({ request }) => {
        received = {
          method: request.method,
          type: request.headers.get('content-type'),
          body: await request.json(),
        };
        return HttpResponse.json({ ok: true });
      }),
    );
    await api.post('/things', { name: 'x' });
    expect(received).toEqual({ method: 'POST', type: 'application/json', body: { name: 'x' } });
    await api.patch('/things', { name: 'y' });
    expect(received).toEqual({ method: 'PATCH', type: 'application/json', body: { name: 'y' } });
  });

  it('turns a non-2xx answer into an ApiError carrying the status and the API message', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json({ statusCode: 503, message: 'database down' }, { status: 503 }),
      ),
    );
    const error = await api.get('/health').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503, message: 'database down' });
  });

  it('reads the code and the numbers a refusal carries', async () => {
    server.use(
      http.post('/api/things', () =>
        HttpResponse.json(
          {
            code: 'raw_stock_too_low',
            message: 'Only 120 raw bricks in stock, cannot load 500',
            details: { available: 120, quantity: 500 },
          },
          { status: 400 },
        ),
      ),
    );
    const error = await api.post('/things').catch((e: unknown) => e);
    expect(error).toMatchObject({
      status: 400,
      code: 'raw_stock_too_low',
      details: { available: 120, quantity: 500 },
    });
  });

  it('drops a code it does not know, rather than passing it on as one', async () => {
    server.use(
      http.post('/api/things', () =>
        HttpResponse.json(
          { code: 'invented_since_this_build', message: 'Refused' },
          { status: 400 },
        ),
      ),
    );
    const error = await api.post('/things').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 400, message: 'Refused' });
    expect((error as ApiError).code).toBeUndefined();
  });

  it('resolves to undefined on a 204', async () => {
    server.use(http.delete('/api/things/1', () => new HttpResponse(null, { status: 204 })));
    await expect(api.delete('/things/1')).resolves.toBeUndefined();
  });
});
