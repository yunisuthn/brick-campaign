import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { hasCode } from './e2e.helpers.js';

describe('Auth (e2e)', () => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'a-long-enough-password';
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email } });
    await app.close();
  });

  it('rejects a malformed login body with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password })
      .expect(400)
      .expect(hasCode('validation_failed'));
  });

  it('rejects wrong credentials with 401 and no cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401)
      .expect(hasCode('invalid_credentials'));
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('refuses /auth/me without a session', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect(hasCode('session_required'));
  });

  it('logs in, reads the session, logs out, and is refused again', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: email.toUpperCase(), password })
      .expect(200);
    expect(login.body).toEqual({ id: expect.any(String), email });
    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);

    const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body).toEqual(login.body);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(204);
    const cleared = logout.headers['set-cookie'][0];
    expect(cleared).toMatch(/^session=;/);
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/);

    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cleared).expect(401);
  });

  it('refuses a tampered cookie', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'session=not.a.jwt')
      .expect(401);
  });
});
