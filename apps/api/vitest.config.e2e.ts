import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// The e2e suite talks to the real database: load the root .env before the workers start.
config({ path: new URL('../../.env', import.meta.url), quiet: true });

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
