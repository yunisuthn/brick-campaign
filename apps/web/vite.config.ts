import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * The front calls the API under `/api`; in development Vite forwards it to the Nest server
 * (same origin, so the session cookie needs no CORS setup). The API has no prefix of its own,
 * hence the rewrite; a reverse proxy does the same in production.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3000',
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
});
