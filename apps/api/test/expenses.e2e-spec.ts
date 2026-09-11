import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Expenses (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2089;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let batchId: string;
  let fieldId: string;

  async function cleanUp() {
    const campaign = { year };
    await ctx.prisma.expense.deleteMany({ where: { campaign } });
    await ctx.prisma.contractorWork.deleteMany({ where: { campaign } });
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
    const day = (d: string) => new Date(`2089-${d}T00:00:00Z`);
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
    fieldId = field.id;
    await prisma.production.create({
      data: {
        campaignId,
        moulderId: moulder.id,
        riceFieldId: fieldId,
        date: day('06-01'),
        quantity: 40000,
      },
    });
    const batch = await prisma.kilnBatch.create({
      data: { campaignId, loadedOn: day('07-01'), quantity: 40000 },
    });
    batchId = batch.id;
    // Labour of the batch: 40 000 x 5 (transport) + 40 000 x 3 (loading) = 320 000.
    await prisma.contractorWork.createMany({
      data: (['transport', 'kiln_loading'] as const).map((type) => ({
        campaignId,
        kilnBatchId: batchId,
        type,
        contractorName: `${prefix} Solo`,
        date: day('07-01'),
        quantity: 40000,
      })),
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/api/campaigns/${campaignId}/expenses`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('refuses a batch of another campaign with 400', async () => {
    await request(ctx.app.getHttpServer())
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2089-07-02',
        category: 'akofa',
        amount: 300_000,
        label: 'x',
        kilnBatchId: '00000000-0000-7000-8000-000000000000',
      })
      .expect(400);
  });

  it('records, filters, corrects, detaches and cancels expenses', async () => {
    const server = ctx.app.getHttpServer();

    const rent = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2089-05-02',
        category: 'rice_field',
        amount: 500_000,
        label: 'Contrat saison',
        riceFieldId: fieldId,
      })
      .expect(201);
    expect(rent.body).toEqual({
      id: expect.any(String),
      campaignId,
      kilnBatchId: null,
      riceFieldId: fieldId,
      date: '2089-05-02',
      category: 'rice_field',
      amount: 500_000,
      label: 'Contrat saison',
    });
    const fuel = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({
        date: '2089-07-02',
        category: 'akofa',
        amount: 300_000,
        label: '3 charrettes',
        kilnBatchId: batchId,
      })
      .expect(201);

    const all = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(all.body).toEqual([fuel.body, rent.body]);
    const byCategory = await request(server)
      .get(`${path()}?category=akofa`)
      .set('Cookie', cookie)
      .expect(200);
    expect(byCategory.body).toEqual([fuel.body]);
    const byBatch = await request(server)
      .get(`${path()}?kilnBatchId=${batchId}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(byBatch.body).toEqual([fuel.body]);
    await request(server).get(`${path()}?category=salary`).set('Cookie', cookie).expect(400);

    // A price fix keeps the batch; detaching is explicit.
    const fixed = await request(server)
      .patch(`${path()}/${fuel.body.id}`)
      .set('Cookie', cookie)
      .send({ amount: 320_000 })
      .expect(200);
    expect(fixed.body).toEqual({ ...fuel.body, amount: 320_000 });

    // The batch reads its cost back: the linked fuel plus the works at the campaign rates.
    const batchPath = `/api/campaigns/${campaignId}/kiln-batches/${batchId}`;
    const costed = await request(server).get(batchPath).set('Cookie', cookie).expect(200);
    expect(costed.body.cost).toEqual({ expenses: 320_000, labour: 320_000, total: 640_000 });

    const detached = await request(server)
      .patch(`${path()}/${fuel.body.id}`)
      .set('Cookie', cookie)
      .send({ kilnBatchId: null })
      .expect(200);
    expect(detached.body).toEqual({ ...fixed.body, kilnBatchId: null });
    const uncosted = await request(server).get(batchPath).set('Cookie', cookie).expect(200);
    expect(uncosted.body.cost).toEqual({ expenses: 0, labour: 320_000, total: 320_000 });

    await request(server).delete(`${path()}/${rent.body.id}`).set('Cookie', cookie).expect(204);
    await request(server).get(`${path()}/${rent.body.id}`).set('Cookie', cookie).expect(404);
    const after = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(after.body).toEqual([detached.body]);
  });
});
