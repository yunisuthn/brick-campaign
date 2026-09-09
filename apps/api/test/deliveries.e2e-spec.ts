import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Deliveries (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2090;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let saleId: string;

  async function cleanUp() {
    const campaign = { year };
    await ctx.prisma.delivery.deleteMany({ where: { sale: { campaign } } });
    await ctx.prisma.sale.deleteMany({ where: { campaign } });
    await ctx.prisma.kilnBatch.deleteMany({ where: { campaign } });
    await ctx.prisma.production.deleteMany({ where: { campaign } });
    await ctx.prisma.campaign.deleteMany({ where: campaign });
    await ctx.prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.prisma.riceField.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.prisma.client.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();
    const { prisma } = ctx;
    const day = (d: string) => new Date(`2090-${d}T00:00:00Z`);
    const campaign = await prisma.campaign.create({
      data: {
        year,
        startedOn: day('05-01'),
        mouldingRate: 20,
        transportRate: 5,
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const moulder = await prisma.moulder.create({ data: { name: `${prefix} Rakoto` } });
    const field = await prisma.riceField.create({
      data: { name: `${prefix} field`, location: 'x', contractType: 'durable' },
    });
    await prisma.production.create({
      data: {
        campaignId,
        moulderId: moulder.id,
        riceFieldId: field.id,
        date: day('06-01'),
        quantity: 50000,
      },
    });
    // 40 000 fired bricks: one batch out of the kiln. The second one is still firing and must not count.
    await prisma.kilnBatch.createMany({
      data: [
        { campaignId, loadedOn: day('07-01'), unloadedOn: day('07-08'), quantity: 40000 },
        { campaignId, loadedOn: day('07-15'), quantity: 40000 },
      ],
    });
    const client = await prisma.client.create({
      data: { name: `${prefix} Rabe`, locality: 'Talatamaty' },
    });
    const sale = await prisma.sale.create({
      data: {
        campaignId,
        clientId: client.id,
        date: day('08-01'),
        orderedQuantity: 5000,
        unitPrice: 250,
      },
    });
    saleId = sale.id;
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/campaigns/${campaignId}/sales/${saleId}/deliveries`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('refuses a trip dated before the sale with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2090-07-31', quantity: 2500, cost: 60000 })
      .expect(400);
  });

  it('delivers while the fired stock lasts, refuses beyond, corrects, guards the sale and cancels', async () => {
    const server = ctx.app.getHttpServer();

    const first = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2090-08-05', quantity: 2500, cost: 60000, plate: '1234 TAB' })
      .expect(201);
    expect(first.body).toEqual({
      id: expect.any(String),
      saleId,
      date: '2090-08-05',
      quantity: 2500,
      cost: 60000,
      plate: '1234 TAB',
    });
    const second = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2090-08-06', quantity: 2500, cost: 60000 })
      .expect(201);
    expect(second.body.plate).toBeNull();

    // 40 000 - 5 000 = 35 000 left: a trip of 35 001 cannot be recorded.
    const refused = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2090-08-07', quantity: 35001, cost: 60000 })
      .expect(400);
    expect(refused.body.message).toMatch(/Only 35000 fired bricks/);

    // Growing the second trip to 37 500 fits (40 000 - 2 500), 37 501 does not.
    await request(server)
      .patch(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .send({ quantity: 37501 })
      .expect(400);
    const grown = await request(server)
      .patch(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .send({ quantity: 37500 })
      .expect(200);
    expect(grown.body).toEqual({ ...second.body, quantity: 37500 });

    const list = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(list.body).toEqual([first.body, grown.body]);

    const stock = await request(server)
      .get(`/campaigns/${campaignId}/stock`)
      .set('Cookie', cookie)
      .expect(200);
    expect(stock.body).toMatchObject({ unloaded: 40000, delivered: 40000, fired: 0 });

    // The sale cannot go while trips point at it.
    await request(server)
      .delete(`/campaigns/${campaignId}/sales/${saleId}`)
      .set('Cookie', cookie)
      .expect(409);

    await request(server).delete(`${path()}/${grown.body.id}`).set('Cookie', cookie).expect(204);
    await request(server).get(`${path()}/${grown.body.id}`).set('Cookie', cookie).expect(404);
    const after = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(after.body).toEqual([first.body]);
  });

  it('404s on a sale of another campaign', async () => {
    await request(ctx.app.getHttpServer())
      .get(`/campaigns/00000000-0000-7000-8000-000000000000/sales/${saleId}/deliveries`)
      .set('Cookie', cookie)
      .expect(404);
  });
});
