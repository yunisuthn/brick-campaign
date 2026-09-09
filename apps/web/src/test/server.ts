import { setupServer } from 'msw/node';

/** One MSW server for every spec; each test adds the handlers it needs with `server.use`. */
export const server = setupServer();
