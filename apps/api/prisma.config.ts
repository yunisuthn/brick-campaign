import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Prisma CLI runs outside Nest: load the root .env itself, resolved from this file rather than the cwd.
config({ path: new URL('../../.env', import.meta.url), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env.DATABASE_URL },
});
