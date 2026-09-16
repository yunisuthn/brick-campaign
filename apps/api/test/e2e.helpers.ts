import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import type { ErrorCode } from '../src/common/api-error.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Unique per test file, so files running in parallel never clean up each other's rows.
 * A timestamp is not enough: two files can load in the same millisecond.
 */
export function uniqueTag(): string {
  return `e2e-${randomUUID().slice(0, 8)}`;
}

export interface E2eContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  /** Session cookie of a throwaway user, to pass as `Cookie` on every authenticated request. */
  cookie: string;
  /** Removes the throwaway user and stops the app. */
  close(): Promise<void>;
}

/** Boots the real application (same middleware as main.ts), creates a user and logs it in. */
export async function bootstrapE2e(): Promise<E2eContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication<App> = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);

  const email = `${uniqueTag()}@example.com`;
  const password = 'a-long-enough-password';
  await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });

  return {
    app,
    prisma,
    cookie: login.headers['set-cookie'][0],
    async close() {
      await prisma.user.delete({ where: { email } });
      await app.close();
    },
  };
}

/**
 * Supertest check on a refusal: the code is what the front reads (reference document, section
 * 10.1), so it is what the e2e pin. The English message stays free to change.
 */
export function hasCode(code: ErrorCode) {
  return (res: { body: unknown }) => {
    expect(res.body).toMatchObject({ code });
  };
}
