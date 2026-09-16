import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Clients (e2e)', () => {
  const prefix = uniqueTag();
  let ctx: E2eContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
  });

  afterAll(async () => {
    await ctx.prisma.client.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.close();
  });

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get('/api/clients').expect(401);
  });

  it('rejects a blank locality with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/clients')
      .set('Cookie', cookie)
      .send({ name: `${prefix} x`, locality: ' ' })
      .expect(400);
  });

  it('creates, lists, reads and updates a client', async () => {
    const server = ctx.app.getHttpServer();
    const body = { name: `${prefix} Rakoto`, locality: 'Ambohidratrimo' };

    const created = await request(server)
      .post('/api/clients')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String), phone: null, ...body });
    const id: string = created.body.id;

    const list = await request(server).get('/api/clients').set('Cookie', cookie).expect(200);
    expect(list.body).toContainEqual(created.body);

    const read = await request(server).get(`/api/clients/${id}`).set('Cookie', cookie).expect(200);
    expect(read.body).toEqual(created.body);

    const updated = await request(server)
      .patch(`/api/clients/${id}`)
      .set('Cookie', cookie)
      .send({ phone: '034 12 345 67', locality: 'Talatamaty' })
      .expect(200);
    expect(updated.body).toEqual({
      ...created.body,
      phone: '034 12 345 67',
      locality: 'Talatamaty',
    });
  });
});
