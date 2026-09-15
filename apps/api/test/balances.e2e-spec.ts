import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Balances (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2095;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let rakotoId: string;
  let rasoaId: string;

  async function cleanUp() {
    await ctx.prisma.payment.deleteMany({ where: { campaign: { year } } });
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
        startedOn: new Date('2095-05-01T00:00:00Z'),
        mouldingRates: [20],
        transportRates: [5],
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const field = await prisma.riceField.create({
      data: { name: `${prefix} field`, location: 'x', contractType: 'durable' },
    });
    rakotoId = (await prisma.moulder.create({ data: { name: `${prefix} Rakoto` } })).id;
    rasoaId = (await prisma.moulder.create({ data: { name: `${prefix} Rasoa` } })).id;

    const day = (d: string) => new Date(`2095-${d}T00:00:00Z`);
    await prisma.production.createMany({
      data: [
        {
          campaignId,
          moulderId: rakotoId,
          riceFieldId: field.id,
          startedOn: day('06-01'),
          quantity: 1000,
          rate: 20,
        },
        {
          campaignId,
          moulderId: rakotoId,
          riceFieldId: field.id,
          startedOn: day('06-02'),
          quantity: 1500,
          rate: 20,
        },
        // Cancelled: must not count.
        {
          campaignId,
          moulderId: rakotoId,
          riceFieldId: field.id,
          startedOn: day('06-03'),
          quantity: 9999,
          rate: 20,
          cancelledAt: new Date(),
        },
        {
          campaignId,
          moulderId: rasoaId,
          riceFieldId: field.id,
          startedOn: day('06-01'),
          quantity: 800,
          rate: 20,
        },
      ],
    });
    await prisma.payment.createMany({
      data: [
        { campaignId, moulderId: rakotoId, type: 'vatsy', date: day('06-05'), amount: 10000 },
        { campaignId, moulderId: rakotoId, type: 'advance', date: day('06-06'), amount: 15000 },
        // A contractor payment: not part of any moulder balance.
        {
          campaignId,
          contractorName: `${prefix} Solo`,
          type: 'advance',
          date: day('06-06'),
          amount: 7000,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer())
      .get(`/api/campaigns/${campaignId}/balances/moulders`)
      .expect(401);
  });

  it('lists what each moulder is owed for the campaign', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/campaigns/${campaignId}/balances/moulders`)
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toEqual([
      {
        moulderId: rakotoId,
        name: `${prefix} Rakoto`,
        bricks: 2500,
        earned: 50000,
        paid: 25000,
        paidByType: { vatsy: 10000, advance: 15000, settlement: 0 },
        due: 25000,
      },
      {
        moulderId: rasoaId,
        name: `${prefix} Rasoa`,
        bricks: 800,
        earned: 16000,
        paid: 0,
        paidByType: { vatsy: 0, advance: 0, settlement: 0 },
        due: 16000,
      },
    ]);
  });

  it('reads one moulder, and 404s on an unknown one', async () => {
    const server = ctx.app.getHttpServer();
    const res = await request(server)
      .get(`/api/campaigns/${campaignId}/balances/moulders/${rasoaId}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toMatchObject({ moulderId: rasoaId, due: 16000 });
    await request(server)
      .get(`/api/campaigns/${campaignId}/balances/moulders/00000000-0000-7000-8000-000000000000`)
      .set('Cookie', cookie)
      .expect(404);
  });

  it('reports what is earned and due as unknown while an entry has no rate fixed yet', async () => {
    await ctx.prisma.production.updateMany({
      where: { campaignId, moulderId: rakotoId, cancelledAt: null },
      data: { rate: null },
    });
    try {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/campaigns/${campaignId}/balances/moulders/${rakotoId}`)
        .set('Cookie', cookie)
        .expect(200);
      expect(res.body).toMatchObject({ bricks: 2500, earned: null, paid: 25000, due: null });
    } finally {
      await ctx.prisma.production.updateMany({
        where: { campaignId, moulderId: rakotoId, cancelledAt: null },
        data: { rate: 20 },
      });
    }
  });
});
