/** Thrown for any non-2xx answer; `status` lets a screen tell a 400 from a 401. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Every call goes through here: same-origin `/api` prefix (proxied in development), the session
 * cookie sent along, JSON both ways. The API's `message` field becomes the error message.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...init.headers },
    ...init,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, errorMessage(body) ?? response.statusText);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

function errorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('message' in body)) return undefined;
  const { message } = body;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return undefined;
}
