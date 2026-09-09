import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Moulders (e2e)', () => {
  const email = `e2e-moulders-${Date.now()}@example.com`;
  const password = 'a-long-enough-password';
  // A run-specific prefix so cleanup removes only what this run created.
  const prefix = `e2e-${Date.now()}`;
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    cookie = login.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.user.delete({ where: { email } });
    await app.close();
  });

  it('requires a session', async () => {
    await request(app.getHttpServer()).get('/moulders').expect(401);
  });

  it('rejects a blank name and a bad query flag with 400', async () => {
    const server = app.getHttpServer();
    await request(server).post('/moulders').set('Cookie', cookie).send({ name: ' ' }).expect(400);
    await request(server).get('/moulders?includeInactive=maybe').set('Cookie', cookie).expect(400);
  });

  it('creates, reads, retires and hides a retired moulder from the default list', async () => {
    const server = app.getHttpServer();
    const name = `${prefix} Rakoto`;

    const created = await request(server)
      .post('/moulders')
      .set('Cookie', cookie)
      .send({ name: ` ${name} `, memberCount: 3 })
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String), name, memberCount: 3, active: true });
    const id: string = created.body.id;

    const read = await request(server).get(`/moulders/${id}`).set('Cookie', cookie).expect(200);
    expect(read.body).toEqual(created.body);

    const retired = await request(server)
      .patch(`/moulders/${id}`)
      .set('Cookie', cookie)
      .send({ active: false })
      .expect(200);
    expect(retired.body).toEqual({ ...created.body, active: false });

    const active = await request(server).get('/moulders').set('Cookie', cookie).expect(200);
    expect(active.body.map((m: { id: string }) => m.id)).not.toContain(id);

    const all = await request(server)
      .get('/moulders?includeInactive=true')
      .set('Cookie', cookie)
      .expect(200);
    expect(all.body.map((m: { id: string }) => m.id)).toContain(id);
  });
});
