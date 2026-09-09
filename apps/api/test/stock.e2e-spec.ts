import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Stock (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2092;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;

  async function cleanUp() {
    const campaign = { year };
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
        startedOn: new Date('2092-05-01T00:00:00Z'),
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
    const day = (d: string) => new Date(`2092-${d}T00:00:00Z`);
    await prisma.production.createMany({
      data: [
        {
          campaignId,
          moulderId: moulder.id,
          riceFieldId: field.id,
          date: day('06-01'),
          quantity: 130000,
        },
        // Cancelled: must not count.
        {
          campaignId,
          moulderId: moulder.id,
          riceFieldId: field.id,
          date: day('06-02'),
          quantity: 99999,
          cancelledAt: new Date(),
        },
      ],
    });
    await prisma.kilnBatch.createMany({
      data: [
        { campaignId, loadedOn: day('07-01'), unloadedOn: day('07-08'), quantity: 40000 },
        { campaignId, loadedOn: day('07-15'), quantity: 45000 },
        { campaignId, loadedOn: day('07-20'), quantity: 40000, cancelledAt: new Date() },
      ],
    });
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(`/campaigns/${campaignId}/stock`).expect(401);
  });

  it('sums live entries only: one batch fired, one still in the kiln', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get(`/campaigns/${campaignId}/stock`)
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toEqual({
      campaignId,
      produced: 130000,
      loaded: 85000,
      unloaded: 40000,
      delivered: 0,
      raw: 45000,
      inKiln: 45000,
      fired: 40000,
    });
  });

  it('404s on an unknown campaign', async () => {
    await request(ctx.app.getHttpServer())
      .get('/campaigns/00000000-0000-7000-8000-000000000000/stock')
      .set('Cookie', cookie)
      .expect(404);
  });
});
