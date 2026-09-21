import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag, hasCode } from './e2e.helpers.js';

describe('Productions (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2097;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let moulderId: string;
  let retiredMoulderId: string;
  let riceFieldId: string;

  async function cleanUp() {
    await ctx.prisma.production.deleteMany({ where: { campaign: { year } } });
    await ctx.prisma.campaign.deleteMany({ where: { year } });
    await ctx.prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
    await ctx.prisma.riceField.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();

    const campaign = await ctx.prisma.campaign.create({
      data: {
        year,
        startedOn: new Date('2097-05-01T00:00:00Z'),
        mouldingRates: [20],
        transportRates: [5],
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const moulder = await ctx.prisma.moulder.create({ data: { name: `${prefix} Rakoto` } });
    moulderId = moulder.id;
    const retired = await ctx.prisma.moulder.create({
      data: { name: `${prefix} Rabe`, active: false },
    });
    retiredMoulderId = retired.id;
    const field = await ctx.prisma.riceField.create({
      data: { name: `${prefix} Ambohitsoa`, location: 'Ambohidratrimo', contractType: 'durable' },
    });
    riceFieldId = field.id;
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/api/campaigns/${campaignId}/productions`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('returns 404 for an unknown campaign', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/campaigns/00000000-0000-7000-8000-000000000000/productions')
      .set('Cookie', cookie)
      .expect(404)
      .expect(hasCode('campaign_not_found'));
  });

  it('rejects a date before the campaign start, an end before the start, and a retired moulder with 400', async () => {
    const server = ctx.app.getHttpServer();
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ startedOn: '2097-04-30', moulderId, riceFieldId, quantity: 1000 })
      .expect(400)
      .expect(hasCode('date_outside_campaign'));
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({
        startedOn: '2097-06-01',
        endedOn: '2097-05-31',
        moulderId,
        riceFieldId,
        quantity: 1000,
      })
      .expect(400)
      .expect(hasCode('production_dates_out_of_order'));
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ startedOn: '2097-06-01', moulderId: retiredMoulderId, riceFieldId, quantity: 1000 })
      .expect(400)
      .expect(hasCode('moulder_inactive'));
  });

  it('creates, lists with filters, corrects, cancels and hides the cancelled entry', async () => {
    const server = ctx.app.getHttpServer();

    const first = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ startedOn: '2097-06-01', moulderId, riceFieldId, quantity: 1000, rate: 20 })
      .expect(201);
    expect(first.body).toEqual({
      id: expect.any(String),
      campaignId,
      moulderId,
      riceFieldId,
      startedOn: '2097-06-01',
      endedOn: null,
      quantity: 1000,
      rate: 20,
    });
    const second = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ startedOn: '2097-06-15', moulderId, riceFieldId, quantity: 1200 })
      .expect(201);

    const all = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(all.body.map((p: { id: string }) => p.id)).toEqual([second.body.id, first.body.id]);

    const june1 = await request(server)
      .get(`${path()}?from=2097-06-01&to=2097-06-01&moulderId=${moulderId}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(june1.body).toEqual([first.body]);

    const fixed = await request(server)
      .patch(`${path()}/${first.body.id}`)
      .set('Cookie', cookie)
      .send({ quantity: 1100 })
      .expect(200);
    expect(fixed.body).toEqual({ ...first.body, quantity: 1100 });

    const finished = await request(server)
      .patch(`${path()}/${first.body.id}`)
      .set('Cookie', cookie)
      .send({ endedOn: '2097-06-02' })
      .expect(200);
    expect(finished.body).toEqual({ ...fixed.body, endedOn: '2097-06-02' });

    await request(server).delete(`${path()}/${second.body.id}`).set('Cookie', cookie).expect(204);
    await request(server).get(`${path()}/${second.body.id}`).set('Cookie', cookie).expect(404);
    await request(server).delete(`${path()}/${second.body.id}`).set('Cookie', cookie).expect(404);

    const remaining = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(remaining.body).toEqual([finished.body]);

    const kept = await ctx.prisma.production.findUnique({ where: { id: second.body.id } });
    expect(kept?.cancelledAt).toBeInstanceOf(Date);
  });
});
