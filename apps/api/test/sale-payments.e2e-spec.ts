import request from 'supertest';
import { bootstrapE2e, type E2eContext, hasCode, uniqueTag } from './e2e.helpers.js';

describe('Sale payments (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2089;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let saleId: string;

  async function cleanUp() {
    const campaign = { year };
    await ctx.prisma.salePayment.deleteMany({ where: { sale: { campaign } } });
    await ctx.prisma.sale.deleteMany({ where: { campaign } });
    await ctx.prisma.campaign.deleteMany({ where: campaign });
    await ctx.prisma.client.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();
    const { prisma } = ctx;
    const day = (d: string) => new Date(`2089-${d}T00:00:00Z`);
    const campaign = await prisma.campaign.create({
      data: { year, startedOn: day('05-01') },
    });
    campaignId = campaign.id;
    const client = await prisma.client.create({
      data: { name: `${prefix} Rabe`, locality: 'Talatamaty' },
    });
    // 5 000 bricks at 250 Ar: the sale is worth 1 250 000 Ar.
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

  const path = () => `/api/campaigns/${campaignId}/sales/${saleId}/payments`;
  const salePath = () => `/api/campaigns/${campaignId}/sales/${saleId}`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('refuses an instalment dated before the sale', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2089-07-31', amount: 100_000 })
      .expect(400)
      .expect(hasCode('sale_payment_before_sale'));
  });

  it('takes the instalments one after another, and refuses to go past the total', async () => {
    const server = ctx.app.getHttpServer();

    const first = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2089-08-05', amount: 500_000 })
      .expect(201);
    expect(first.body).toEqual({
      id: expect.any(String),
      saleId,
      date: '2089-08-05',
      amount: 500_000,
    });

    const partly = await request(server).get(salePath()).set('Cookie', cookie).expect(200);
    expect(partly.body).toMatchObject({
      receivedAmount: 500_000,
      outstanding: 750_000,
      status: 'partially_paid',
    });

    // One Ariary more than what is left is refused, and says what is left.
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2089-08-20', amount: 750_001 })
      .expect(400)
      .expect(hasCode('sale_overpaid'))
      .expect(({ body }: { body: { details: unknown } }) => {
        expect(body.details).toEqual({ remaining: 750_000, amount: 750_001 });
      });

    const second = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2089-08-20', amount: 750_000 })
      .expect(201);

    const settled = await request(server).get(salePath()).set('Cookie', cookie).expect(200);
    expect(settled.body).toMatchObject({
      receivedAmount: 1_250_000,
      outstanding: 0,
      status: 'paid',
    });

    // The sale holds the instalments: it cannot be cancelled while they are live.
    await request(server)
      .delete(salePath())
      .set('Cookie', cookie)
      .expect(409)
      .expect(hasCode('sale_has_payments'));

    const list = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(list.body).toEqual([first.body, second.body]);

    // Correcting the last one down puts the sale back to partly paid.
    await request(server)
      .patch(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .send({ amount: 700_000 })
      .expect(200);
    const corrected = await request(server).get(salePath()).set('Cookie', cookie).expect(200);
    expect(corrected.body).toMatchObject({ receivedAmount: 1_200_000, status: 'partially_paid' });

    // Cancelling takes it out of the sums, and out of the API.
    await request(server).delete(`${path()}/${second.body.id}`).set('Cookie', cookie).expect(204);
    await request(server)
      .get(`${path()}/${second.body.id}`)
      .set('Cookie', cookie)
      .expect(404)
      .expect(hasCode('sale_payment_not_found'));
    const after = await request(server).get(salePath()).set('Cookie', cookie).expect(200);
    expect(after.body).toMatchObject({ receivedAmount: 500_000, outstanding: 750_000 });
  });
});
