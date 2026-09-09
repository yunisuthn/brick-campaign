import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Rice fields (e2e)', () => {
  const email = `e2e-rice-fields-${Date.now()}@example.com`;
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
    await prisma.riceField.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.user.delete({ where: { email } });
    await app.close();
  });

  it('requires a session', async () => {
    await request(app.getHttpServer()).get('/rice-fields').expect(401);
  });

  it('rejects an unknown contract type with 400', async () => {
    await request(app.getHttpServer())
      .post('/rice-fields')
      .set('Cookie', cookie)
      .send({ name: `${prefix} x`, location: 'Somewhere', contractType: 'monthly' })
      .expect(400);
  });

  it('creates, lists, reads and updates a rice field', async () => {
    const server = app.getHttpServer();
    const body = {
      name: `${prefix} Ambohitsoa`,
      location: 'Ambohidratrimo',
      contractType: 'durable',
    };

    const created = await request(server)
      .post('/rice-fields')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String), surfaceM2: null, ...body });
    const id: string = created.body.id;

    const list = await request(server).get('/rice-fields').set('Cookie', cookie).expect(200);
    expect(list.body).toContainEqual(created.body);

    const read = await request(server).get(`/rice-fields/${id}`).set('Cookie', cookie).expect(200);
    expect(read.body).toEqual(created.body);

    const updated = await request(server)
      .patch(`/rice-fields/${id}`)
      .set('Cookie', cookie)
      .send({ surfaceM2: 1200, contractType: 'seasonal' })
      .expect(200);
    expect(updated.body).toEqual({ ...created.body, surfaceM2: 1200, contractType: 'seasonal' });
  });
});
