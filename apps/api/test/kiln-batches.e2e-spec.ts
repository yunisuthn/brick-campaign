import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Kiln batches (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2094;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;

  async function cleanUp() {
    await ctx.prisma.kilnBatch.deleteMany({ where: { campaign: { year } } });
    await ctx.prisma.production.deleteMany({ where: { campaign: { year } } });
    await ctx.prisma.campaign.deleteMany({ where: { year } });
    await ctx.prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.prisma.riceField.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();
    const { prisma } = ctx;
    const campaign = await prisma.campaign.create({
      data: {
        year,
        startedOn: new Date('2094-05-01T00:00:00Z'),
        mouldingRates: [20],
        transportRates: [5],
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const moulder = await prisma.moulder.create({ data: { name: `${prefix} Rakoto` } });
    const field = await prisma.riceField.create({
      data: { name: `${prefix} field`, location: 'x', contractType: 'durable' },
    });
    // 90 000 raw bricks in stock: room for two batches of 40 000, not three.
    await prisma.production.createMany({
      data: [50000, 40000].map((quantity, i) => ({
        campaignId,
        moulderId: moulder.id,
        riceFieldId: field.id,
        startedOn: new Date(`2094-06-0${i + 1}T00:00:00Z`),
        quantity,
      })),
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/api/campaigns/${campaignId}/kiln-batches`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('refuses a batch below the minimum with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({ loadedOn: '2094-07-01', quantity: 39999 })
      .expect(400);
  });

  it('loads while the raw stock lasts, refuses beyond, unloads, corrects and cancels', async () => {
    const server = ctx.app.getHttpServer();

    const first = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ loadedOn: '2094-07-01', quantity: 40000 })
      .expect(201);
    expect(first.body).toEqual({
      id: expect.any(String),
      campaignId,
      loadedOn: '2094-07-01',
      unloadedOn: null,
      quantity: 40000,
      cost: { expenses: 0, labour: 0, total: 0 },
    });
    const second = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ loadedOn: '2094-07-15', quantity: 45000 })
      .expect(201);

    // 90 000 - 85 000 = 5 000 left: a third batch cannot be loaded.
    const refused = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ loadedOn: '2094-08-01', quantity: 40000 })
      .expect(400);
    expect(refused.body.message).toMatch(/Only 5000 raw bricks/);

    // Growing the second batch to 50 000 fits (90 000 - 40 000), 50 001 does not.
    await request(server)
      .patch(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .send({ quantity: 50001 })
      .expect(400);
    const grown = await request(server)
      .patch(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .send({ quantity: 50000 })
      .expect(200);
    expect(grown.body).toEqual({ ...second.body, quantity: 50000 });

    await request(server)
      .patch(`${path()}/${first.body.id}`)
      .set('Cookie', cookie)
      .send({ unloadedOn: '2094-06-30' })
      .expect(400);
    const unloaded = await request(server)
      .patch(`${path()}/${first.body.id}`)
      .set('Cookie', cookie)
      .send({ unloadedOn: '2094-07-08' })
      .expect(200);
    expect(unloaded.body).toEqual({ ...first.body, unloadedOn: '2094-07-08' });

    const list = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(list.body).toEqual([grown.body, unloaded.body]);

    // Cancelling the second batch frees its bricks: the third batch now fits.
    await request(server).delete(`${path()}/${second.body.id}`).set('Cookie', cookie).expect(204);
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ loadedOn: '2094-08-01', quantity: 40000 })
      .expect(201);
  });
});
