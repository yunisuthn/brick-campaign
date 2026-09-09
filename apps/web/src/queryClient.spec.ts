import { ApiError } from './api/client.js';
import { createQueryClient } from './queryClient.js';

describe('createQueryClient', () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry;

  it('never retries a 4xx, retries a network failure or a 5xx once', () => {
    expect(retry).toBeTypeOf('function');
    if (typeof retry !== 'function') return;
    expect(retry(0, new ApiError(401, 'Unauthorized'))).toBe(false);
    expect(retry(0, new ApiError(503, 'down'))).toBe(true);
    expect(retry(1, new ApiError(503, 'down'))).toBe(false);
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true);
  });
});
