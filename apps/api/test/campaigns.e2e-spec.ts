import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/password.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Campaigns (e2e)', () => {
  const email = `e2e-campaigns-${Date.now()}@example.com`;
  const password = 'a-long-enough-password';
  // Years nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const years = [2099, 2098];
  const body = {
    year: years[0],
    startedOn: '2099-05-01',
    mouldingRate: 20,
    transportRate: 5,
    kilnLoadingRate: 5,
  };
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.campaign.deleteMany({ where: { year: { in: years } } });
    await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    cookie = login.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany({ where: { year: { in: years } } });
    await prisma.user.delete({ where: { email } });
    await app.close();
  });

  it('requires a session on every route', async () => {
    const server = app.getHttpServer();
    await request(server).get('/campaigns').expect(401);
    await request(server).post('/campaigns').send(body).expect(401);
  });

  it('rejects an invalid body with the failing paths', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Cookie', cookie)
      .send({ ...body, startedOn: 'May 2099', mouldingRate: -1 })
      .expect(400);
    const paths = res.body.issues.map((i: { path: string }) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['startedOn', 'mouldingRate']));
  });

  it('rejects a malformed id with 400 and an unknown id with 404', async () => {
    const server = app.getHttpServer();
    await request(server).get('/campaigns/not-a-uuid').set('Cookie', cookie).expect(400);
    await request(server)
      .get('/campaigns/00000000-0000-7000-8000-000000000000')
      .set('Cookie', cookie)
      .expect(404);
  });

  it('creates, refuses the same year twice, lists, reads, updates and closes', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String), closedOn: null, ...body });
    const id: string = created.body.id;

    await request(server).post('/campaigns').set('Cookie', cookie).send(body).expect(409);

    await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send({ ...body, year: years[1], startedOn: '2098-05-01' })
      .expect(201);
    const list = await request(server).get('/campaigns').set('Cookie', cookie).expect(200);
    const listedYears = list.body.map((c: { year: number }) => c.year);
    expect(listedYears.indexOf(years[0])).toBeLessThan(listedYears.indexOf(years[1]));

    const read = await request(server).get(`/campaigns/${id}`).set('Cookie', cookie).expect(200);
    expect(read.body).toEqual(created.body);

    await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ closedOn: '2099-04-30' })
      .expect(400);

    const closed = await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ closedOn: '2099-11-30', mouldingRate: 25 })
      .expect(200);
    expect(closed.body).toEqual({ ...created.body, closedOn: '2099-11-30', mouldingRate: 25 });

    await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ year: years[1] })
      .expect(409);
  });
});
