import request from 'supertest';
import { bootstrapE2e, type E2eContext, uniqueTag } from './e2e.helpers.js';

describe('Payments (e2e)', () => {
  const prefix = uniqueTag();
  // A year nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const year = 2096;
  let ctx: E2eContext;
  let cookie: string;
  let campaignId: string;
  let moulderId: string;

  async function cleanUp() {
    await ctx.prisma.payment.deleteMany({ where: { campaign: { year } } });
    await ctx.prisma.campaign.deleteMany({ where: { year } });
    await ctx.prisma.moulder.deleteMany({ where: { name: { startsWith: prefix } } });
  }

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await cleanUp();
    const campaign = await ctx.prisma.campaign.create({
      data: {
        year,
        startedOn: new Date('2096-05-01T00:00:00Z'),
        mouldingRates: [20],
        transportRates: [5],
        kilnLoadingRate: 5,
      },
    });
    campaignId = campaign.id;
    const moulder = await ctx.prisma.moulder.create({ data: { name: `${prefix} Rakoto` } });
    moulderId = moulder.id;
  });

  afterAll(async () => {
    await cleanUp();
    await ctx.close();
  });

  const path = () => `/api/campaigns/${campaignId}/payments`;
  const contractorName = `${prefix} Rasoa`;

  it('requires a session', async () => {
    await request(ctx.app.getHttpServer()).get(path()).expect(401);
  });

  it('rejects a payment with both or neither beneficiary with 400', async () => {
    const server = ctx.app.getHttpServer();
    const base = { date: '2096-06-01', type: 'vatsy', amount: 20000 };
    await request(server).post(path()).set('Cookie', cookie).send(base).expect(400);
    await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ ...base, moulderId, contractorName })
      .expect(400);
  });

  it('is backed by a database constraint, not only by validation', async () => {
    await expect(
      ctx.prisma.payment.create({
        data: {
          campaignId,
          date: new Date('2096-06-01T00:00:00Z'),
          type: 'vatsy',
          amount: 1,
          moulderId,
          contractorName,
        },
      }),
    ).rejects.toThrow(/payments_one_beneficiary_check/);
  });

  it('creates for a moulder and a contractor, filters, switches beneficiary, cancels', async () => {
    const server = ctx.app.getHttpServer();

    const toMoulder = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2096-06-01', type: 'vatsy', amount: 20000, moulderId })
      .expect(201);
    expect(toMoulder.body).toEqual({
      id: expect.any(String),
      campaignId,
      moulderId,
      contractorName: null,
      type: 'vatsy',
      date: '2096-06-01',
      amount: 20000,
    });

    const toContractor = await request(server)
      .post(path())
      .set('Cookie', cookie)
      .send({ date: '2096-06-08', type: 'advance', amount: 50000, contractorName })
      .expect(201);
    expect(toContractor.body).toMatchObject({ moulderId: null, contractorName });

    const byContractor = await request(server)
      .get(`${path()}?contractorName=${encodeURIComponent(contractorName)}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(byContractor.body).toEqual([toContractor.body]);

    const byMoulder = await request(server)
      .get(`${path()}?moulderId=${moulderId}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(byMoulder.body).toEqual([toMoulder.body]);

    const switched = await request(server)
      .patch(`${path()}/${toContractor.body.id}`)
      .set('Cookie', cookie)
      .send({ moulderId })
      .expect(200);
    expect(switched.body).toEqual({ ...toContractor.body, moulderId, contractorName: null });

    await request(server)
      .delete(`${path()}/${toContractor.body.id}`)
      .set('Cookie', cookie)
      .expect(204);
    const remaining = await request(server).get(path()).set('Cookie', cookie).expect(200);
    expect(remaining.body).toEqual([toMoulder.body]);
  });
});
