import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Rice fields (e2e)', () => {
  const prefix = uniqueTag();
  let ctx: E2eContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
  });

  afterAll(async () => {
    await ctx.prisma.riceField.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.close();
  });

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get('/rice-fields').expect(401);
  });

  it('rejects an unknown contract type with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post('/rice-fields')
      .set('Cookie', cookie)
      .send({ name: `${prefix} x`, location: 'Somewhere', contractType: 'monthly' })
      .expect(400);
  });

  it('creates, lists, reads and updates a rice field', async () => {
    const server = ctx.app.getHttpServer();
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
