import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

/**
 * The front calls the API under `/api`; in development Vite forwards it to the Nest server
 * (same origin, so the session cookie needs no CORS setup). The API has no prefix of its own,
 * hence the rewrite; a reverse proxy does the same in production.
 *
 * The API port comes from the root `.env`, the same `PORT` the API itself reads, so the two
 * cannot drift apart; `API_URL` overrides the whole target when the API runs elsewhere.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.API_URL ?? `http://localhost:${env.PORT ?? 3000}`,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.spec.{ts,tsx}'],
    },
  };
});
