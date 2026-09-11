import request from 'supertest';
import { bootstrapE2e, type E2eContext, hasCode } from './e2e.helpers.js';

describe('Campaigns (e2e)', () => {
  // Years nobody will enter for real; wiped before and after so a crashed run leaves no residue.
  const years = [2099, 2098];
  const body = {
    year: years[0],
    startedOn: '2099-05-01',
    mouldingRate: 20,
    transportRate: 5,
    kilnLoadingRate: 5,
  };
  let ctx: E2eContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await bootstrapE2e();
    cookie = ctx.cookie;
    await ctx.prisma.campaign.deleteMany({ where: { year: { in: years } } });
  });

  afterAll(async () => {
    await ctx.prisma.campaign.deleteMany({ where: { year: { in: years } } });
    await ctx.close();
  });

  it('requires a session on every route', async () => {
    const server = ctx.app.getHttpServer();
    await request(server).get('/campaigns').expect(401).expect(hasCode('session_required'));
    await request(server)
      .post('/campaigns')
      .send(body)
      .expect(401)
      .expect(hasCode('session_required'));
  });

  it('rejects an invalid body with the failing paths', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/campaigns')
      .set('Cookie', cookie)
      .send({ ...body, startedOn: 'May 2099', mouldingRate: -1 })
      .expect(400);
    expect(res.body.code).toBe('validation_failed');
    const paths = res.body.issues.map((i: { path: string }) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['startedOn', 'mouldingRate']));
  });

  it('rejects a malformed id with 400 and an unknown id with 404', async () => {
    const server = ctx.app.getHttpServer();
    await request(server)
      .get('/campaigns/not-a-uuid')
      .set('Cookie', cookie)
      .expect(400)
      .expect(hasCode('validation_failed'));
    await request(server)
      .get('/campaigns/00000000-0000-7000-8000-000000000000')
      .set('Cookie', cookie)
      .expect(404)
      .expect(hasCode('campaign_not_found'));
  });

  it('creates, refuses the same year twice, lists, reads, updates and closes', async () => {
    const server = ctx.app.getHttpServer();

    const created = await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send(body)
      .expect(201);
    expect(created.body).toEqual({ id: expect.any(String), closedOn: null, ...body });
    const id: string = created.body.id;

    await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send(body)
      .expect(409)
      .expect(hasCode('campaign_year_taken'));

    await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send({ ...body, year: years[1], startedOn: '2098-05-01' })
      .expect(201);
    const list = await request(server).get('/campaigns').set('Cookie', cookie).expect(200);
    const listedYears = list.body.map((c: { year: number }) => c.year);
    expect(listedYears.indexOf(years[0])).toBeLessThan(listedYears.indexOf(years[1]));

    const read = await request(server).get(`/campaigns/${id}`).set('Cookie', cookie).expect(200);
    expect(read.body).toEqual(created.body);

    await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ closedOn: '2099-04-30' })
      .expect(400)
      .expect(hasCode('campaign_dates_out_of_order'));

    const closed = await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ closedOn: '2099-11-30', mouldingRate: 25 })
      .expect(200);
    expect(closed.body).toEqual({ ...created.body, closedOn: '2099-11-30', mouldingRate: 25 });

    await request(server)
      .patch(`/campaigns/${id}`)
      .set('Cookie', cookie)
      .send({ year: years[1] })
      .expect(409)
      .expect(hasCode('campaign_year_taken'));
  });

  it('creates a campaign with the rates still to be fixed, then fixes one', async () => {
    const server = ctx.app.getHttpServer();
    await ctx.prisma.campaign.deleteMany({ where: { year: { in: years } } });

    const created = await request(server)
      .post('/campaigns')
      .set('Cookie', cookie)
      .send({ year: years[0], startedOn: '2099-05-01' })
      .expect(201);
    expect(created.body).toMatchObject({
      mouldingRate: null,
      transportRate: null,
      kilnLoadingRate: null,
    });

    const fixed = await request(server)
      .patch(`/campaigns/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ mouldingRate: 25 })
      .expect(200);
    expect(fixed.body).toEqual({ ...created.body, mouldingRate: 25 });
  });
});
