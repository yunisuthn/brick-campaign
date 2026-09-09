import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Moulders (e2e)', () => {
  const prefix = uniqueTag();
  let ctx: E2eContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
  });

  afterAll(async () => {
    await ctx.prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.close();
  });

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get('/moulders').expect(401);
  });

  it('rejects a blank name and a bad query flag with 400', async () => {
    const server = ctx.app.getHttpServer();
    await request(server).post('/moulders').set('Cookie', cookie).send({ name: ' ' }).expect(400);
    await request(server).get('/moulders?includeInactive=maybe').set('Cookie', cookie).expect(400);
  });

  it('creates, reads, retires and hides a retired moulder from the default list', async () => {
    const server = ctx.app.getHttpServer();
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
