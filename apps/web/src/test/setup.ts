import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { server } from './server.js';

/**
 * `findBy*` gives up after one second by default, which several files running at once on a
 * slow machine can exceed: the suite then fails on timing, not on behaviour. Waiting longer
 * costs nothing when the element does appear, since these matchers resolve as soon as it does.
 */
configure({ asyncUtilTimeout: 5000 });

// A request no test declared is a bug in the test, not something to let through to the network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});
afterAll(() => server.close());
