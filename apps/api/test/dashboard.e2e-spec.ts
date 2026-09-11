import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Dashboard (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2088;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;

  async function cleanUp() {
    const campaign = { year };
    await ctx.prisma.delivery.deleteMany({ where: { sale: { campaign } } });
    await ctx.prisma.sale.deleteMany({ where: { campaign } });
    await ctx.prisma.expense.deleteMany({ where: { campaign } });
    await ctx.prisma.contractorWork.deleteMany({ where: { campaign } });
    await ctx.prisma.payment.deleteMany({ where: { campaign } });
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
    const day = (d: string) => new Date(`2088-${d}T00:00:00Z`);
    const cancelled = { cancelledAt: new Date() };
    const campaign = await prisma.campaign.create({
      data: {
        year,
        startedOn: day('05-01'),
        mouldingRate: 20,
        transportRate: 5,
        kilnLoadingRate: 3,
      },
    });
    campaignId = campaign.id;
    const moulder = await prisma.moulder.create({ data: { name: `${prefix} Rakoto` } });
    const field = await prisma.riceField.create({
      data: { name: `${prefix} field`, location: 'x', contractType: 'seasonal' },
    });
    const entry = { campaignId, moulderId: moulder.id, riceFieldId: field.id };
    // Every kind of entry has a cancelled twin that must not count.
    await prisma.production.createMany({
      data: [
        { ...entry, date: day('06-01'), quantity: 40000 },
        { ...entry, date: day('06-02'), quantity: 99999, ...cancelled },
      ],
    });
    await prisma.payment.createMany({
      data: [
        { campaignId, moulderId: moulder.id, type: 'advance', date: day('06-15'), amount: 300_000 },
        {
          campaignId,
          contractorName: 'Solo',
          type: 'advance',
          date: day('07-05'),
          amount: 100_000,
        },
        {
          campaignId,
          moulderId: moulder.id,
          type: 'vatsy',
          date: day('06-16'),
          amount: 99999,
          ...cancelled,
        },
      ],
    });
    const batch = await prisma.kilnBatch.create({
      data: { campaignId, loadedOn: day('07-01'), unloadedOn: day('07-08'), quantity: 40000 },
    });
    await prisma.contractorWork.createMany({
      data: [
        {
          campaignId,
          kilnBatchId: batch.id,
          type: 'transport',
          contractorName: 'Solo',
          date: day('07-01'),
          quantity: 40000,
        },
        {
          campaignId,
          kilnBatchId: batch.id,
          type: 'kiln_loading',
          contractorName: 'Solo',
          date: day('07-01'),
          quantity: 40000,
        },
        {
          campaignId,
          kilnBatchId: batch.id,
          type: 'transport',
          contractorName: 'Solo',
          date: day('07-02'),
          quantity: 99999,
          ...cancelled,
        },
      ],
    });
    await prisma.expense.createMany({
      data: [
        {
          campaignId,
          riceFieldId: field.id,
          date: day('05-02'),
          category: 'rice_field',
          amount: 500_000,
          label: 'Contrat',
        },
        {
          campaignId,
          kilnBatchId: batch.id,
          date: day('07-01'),
          category: 'akofa',
          amount: 320_000,
          label: 'Charrettes',
        },
        {
          campaignId,
          date: day('07-01'),
          category: 'food',
          amount: 99999,
          label: 'x',
          ...cancelled,
        },
      ],
    });
    const client = await prisma.client.create({ data: { name: `${prefix} Rabe`, locality: 'x' } });
    const paidSale = await prisma.sale.create({
      data: {
        campaignId,
        clientId: client.id,
        date: day('08-01'),
        orderedQuantity: 5000,
        unitPrice: 250,
        paidOn: day('08-10'),
        amountReceived: 1_250_000,
      },
    });
    await prisma.sale.createMany({
      data: [
        {
          campaignId,
          clientId: client.id,
          date: day('08-15'),
          orderedQuantity: 10000,
          unitPrice: 240,
        },
        {
          campaignId,
          clientId: client.id,
          date: day('08-16'),
          orderedQuantity: 99999,
          unitPrice: 999,
          ...cancelled,
        },
      ],
    });
    await prisma.delivery.createMany({
      data: [
        { saleId: paidSale.id, date: day('08-05'), quantity: 2500, cost: 60_000 },
        { saleId: paidSale.id, date: day('08-06'), quantity: 2500, cost: 60_000 },
        { saleId: paidSale.id, date: day('08-07'), quantity: 99999, cost: 99999, ...cancelled },
      ],
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/api/campaigns/${campaignId}/dashboard`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('sums the live entries of the campaign into one read', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(path())
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toEqual({
      campaignId,
      revenue: 3_650_000,
      received: 1_250_000,
      outstanding: 2_400_000,
      expenses: {
        total: 820_000,
        byCategory: {
          rice_field: 500_000,
          akofa: 320_000,
          tai_charbon: 0,
          fuel: 0,
          repair: 0,
          food: 0,
          other: 0,
        },
      },
      labour: {
        moulding: 800_000,
        transport: 200_000,
        kilnLoading: 120_000,
        total: 1_120_000,
        paid: 400_000,
        outstanding: 720_000,
      },
      deliveryCosts: 120_000,
      // 1 250 000 - 820 000 - 1 120 000 - 120 000
      result: -810_000,
      stock: {
        campaignId,
        produced: 40000,
        loaded: 40000,
        unloaded: 40000,
        delivered: 5000,
        raw: 0,
        inKiln: 0,
        fired: 35000,
      },
    });
  });

  it('404s on an unknown campaign', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/campaigns/00000000-0000-7000-8000-000000000000/dashboard')
      .set('Cookie', cookie)
      .expect(404);
  });
});
