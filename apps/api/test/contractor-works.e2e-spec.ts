import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Contractor works (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2093;
  const contractorName = `${prefix} Solo`;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let batchId: string;

  async function cleanUp() {
    const campaign = { year };
    await ctx.prisma.contractorWork.deleteMany({ where: { campaign } });
    await ctx.prisma.payment.deleteMany({ where: { campaign } });
    await ctx.prisma.kilnBatch.deleteMany({ where: { campaign } });
    await ctx.prisma.production.deleteMany({ where: { campaign } });
    await ctx.prisma.campaign.deleteMany({ where: campaign });
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
        startedOn: new Date('2093-05-01T00:00:00Z'),
        mouldingRate: 20,
        transportRate: 5,
        kilnLoadingRate: 3,
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
        date: new Date('2093-06-01T00:00:00Z'),
        quantity: 40000,
      },
    });
    const batch = await prisma.kilnBatch.create({
      data: { campaignId, loadedOn: new Date('2093-07-01T00:00:00Z'), quantity: 40000 },
    });
    batchId = batch.id;
    await prisma.payment.create({
      data: {
        campaignId,
        contractorName,
        type: 'advance',
        date: new Date('2093-07-02T00:00:00Z'),
        amount: 100000,
      },
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/campaigns/${campaignId}/contractor-works`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('rejects a batch from another campaign or unknown with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2093-07-01',
        kilnBatchId: '00000000-0000-7000-8000-000000000000',
        type: 'transport',
        contractorName,
        quantity: 1000,
      })
      .expect(400);
  });

  it('records works, computes what the contractor is owed, and protects the batch', async () => {
    const server = ctx.app.getHttpServer();

    const transport = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2093-07-01',
        kilnBatchId: batchId,
        type: 'transport',
        contractorName,
        quantity: 40000,
      })
      .expect(201);
    expect(transport.body).toEqual({
      id: expect.any(String),
      campaignId,
      kilnBatchId: batchId,
      type: 'transport',
      contractorName,
      date: '2093-07-01',
      quantity: 40000,
    });
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2093-07-01',
        kilnBatchId: batchId,
        type: 'kiln_loading',
        contractorName,
        quantity: 40000,
      })
      .expect(201);

    const byType = await request(server)
      .get(`${path()}?type=transport`)
      .set('Cookie', cookie)
      .expect(200);
    expect(byType.body).toEqual([transport.body]);

    // 40 000 x 5 + 40 000 x 3 = 320 000 earned, 100 000 advanced.
    const balance = await request(server)
      .get(`/campaigns/${campaignId}/balances/contractors/${encodeURIComponent(contractorName)}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(balance.body).toEqual({
      contractorName,
      bricksByType: { transport: 40000, kiln_loading: 40000 },
      earned: 320000,
      paid: 100000,
      paidByType: { vatsy: 0, advance: 100000, settlement: 0 },
      due: 220000,
    });
    const all = await request(server)
      .get(`/campaigns/${campaignId}/balances/contractors`)
      .set('Cookie', cookie)
      .expect(200);
    expect(all.body).toEqual([balance.body]);

    // The batch has live works: it cannot be cancelled until they are.
    await request(server)
      .delete(`/campaigns/${campaignId}/kiln-batches/${batchId}`)
      .set('Cookie', cookie)
      .expect(409);

    await request(server)
      .delete(`${path()}/${transport.body.id}`)
      .set('Cookie', cookie)
      .expect(204);
    const after = await request(server)
      .get(`/campaigns/${campaignId}/balances/contractors/${encodeURIComponent(contractorName)}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(after.body).toMatchObject({ earned: 120000, due: 20000 });
  });
});
