/**
 * Creates one user account from the environment. There is no public sign-up:
 * the two accounts of the application are created with this script.
 *
 *   SEED_USER_EMAIL=... SEED_USER_PASSWORD=... pnpm --filter api create-user [--reset-password]
 *
 * Refuses to touch an existing account unless --reset-password is given.
 */
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { envSchema } from '../src/config/env.schema.js';
import { hashPassword, normaliseEmail, PASSWORD_MIN_LENGTH } from '../src/auth/password.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

config({ path: new URL('../../../.env', import.meta.url), quiet: true });

const seedSchema = envSchema.pick({ DATABASE_URL: true }).extend({
  SEED_USER_EMAIL: z.email().transform(normaliseEmail),
  SEED_USER_PASSWORD: z.string().min(PASSWORD_MIN_LENGTH),
});

const parsed = seedSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment:\n${details}`);
  process.exit(1);
}
const { DATABASE_URL, SEED_USER_EMAIL: email, SEED_USER_PASSWORD: password } = parsed.data;
const resetPassword = process.argv.includes('--reset-password');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
try {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && !resetPassword) {
    console.error(`User ${email} already exists. Pass --reset-password to change its password.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    console.log(`Password reset for ${email}.`);
  } else {
    await prisma.user.create({ data: { email, passwordHash } });
    console.log(`User ${email} created.`);
  }
} finally {
  await prisma.$disconnect();
}
