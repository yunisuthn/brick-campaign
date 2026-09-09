import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Sales (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2091;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let clientId: string;

  async function cleanUp() {
    await ctx.prisma.sale.deleteMany({ where: { campaign: { year } } });
    await ctx.prisma.campaign.deleteMany({ where: { year } });
    await ctx.prisma.client.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();
    const { prisma } = ctx;
    const campaign = await prisma.campaign.create({
      data: {
        year,
        startedOn: new Date('2091-05-01T00:00:00Z'),
        mouldingRate: 20,
        transportRate: 5,
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const client = await prisma.client.create({
      data: { name: `${prefix} Rakoto`, locality: 'Ambohidratrimo' },
    });
    clientId = client.id;
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/campaigns/${campaignId}/sales`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('refuses a sale dated before the campaign with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({ clientId, date: '2091-04-30', orderedQuantity: 5000, unitPrice: 250 })
      .expect(400);
  });

  it('refuses an unknown client with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({
        clientId: '019930a0-0000-7000-8000-000000000001',
        date: '2091-08-01',
        orderedQuantity: 5000,
        unitPrice: 250,
      })
      .expect(400);
  });

  it('creates a sale unpaid, records the payment, corrects, lists and cancels', async () => {
    const server = ctx.app.getHttpServer();

    const created = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ clientId, date: '2091-08-01', orderedQuantity: 5000, unitPrice: 250 })
      .expect(201);
    expect(created.body).toEqual({
      id: expect.any(String),
      campaignId,
      clientId,
      date: '2091-08-01',
      orderedQuantity: 5000,
      unitPrice: 250,
      payment: null,
    });
    const id: string = created.body.id;

    await request(server)
      .patch(`${path()}/${id}`)
      .set('Cookie', cookie)
      .send({ payment: { paidOn: '2091-07-31', amountReceived: 1_250_000 } })
      .expect(400);
    const paid = await request(server)
      .patch(`${path()}/${id}`)
      .set('Cookie', cookie)
      .send({ payment: { paidOn: '2091-08-20', amountReceived: 1_250_000 } })
      .expect(200);
    expect(paid.body).toEqual({
      ...created.body,
      payment: { paidOn: '2091-08-20', amountReceived: 1_250_000 },
    });

    // A price fix keeps the payment.
    const fixed = await request(server)
      .patch(`${path()}/${id}`)
      .set('Cookie', cookie)
      .send({ unitPrice: 260 })
      .expect(200);
    expect(fixed.body).toEqual({ ...paid.body, unitPrice: 260 });

    const list = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(list.body).toEqual([fixed.body]);

    await request(server).delete(`${path()}/${id}`).set('Cookie', cookie).expect(204);
    await request(server).get(`${path()}/${id}`).set('Cookie', cookie).expect(404);
    const after = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(after.body).toEqual([]);
  });
});
