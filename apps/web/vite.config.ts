import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Installable on a phone's home screen, and the shell loads from the cache (reference
 * document, section 5: no offline mode in the v1, so nothing from the API is cached). Every
 * call under `/api` is left to the network; a navigation with no network falls back to the
 * cached shell, which then says the API is unreachable.
 */
const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
  manifest: {
    name: 'Briqueterie',
    short_name: 'Briqueterie',
    description: 'Gestion de campagne de briques',
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f2',
    theme_color: '#8a3b12',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // The shell only: the built files, and the API left alone.
    globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
  },
});

/**
 * The front calls the API under `/api`; in development Vite forwards it to the Nest server,
 * same origin, so the session cookie needs no CORS setup. Nothing is rewritten on the way: the
 * API answers under `/api` too (reference document, section 10.2), and online it serves this
 * front itself, so a path means the same thing everywhere.
 *
 * The API port comes from the root `.env`, the same `PORT` the API itself reads, so the two
 * cannot drift apart; `API_URL` overrides the whole target when the API runs elsewhere.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  return {
    plugins: [react(), pwa],
    server: {
      proxy: {
        '/api': {
          target: env.API_URL ?? `http://localhost:${env.PORT ?? 3000}`,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.spec.{ts,tsx}'],
      // A form filled key by key takes seconds; the five-second default cut such tests off
      // before the matchers themselves gave up, which reads as a hang rather than a failure.
      testTimeout: 20_000,
    },
  };
});
