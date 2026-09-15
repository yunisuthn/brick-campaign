import { rejectsWithCode } from '../../test/api-error.expect.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { BalancesService } from './balances.service.js';

describe('BalancesService', () => {
  const campaignFindUnique = vi.fn();
  const moulderFindUnique = vi.fn();
  const moulderFindMany = vi.fn();
  const productionFindMany = vi.fn();
  const paymentFindMany = vi.fn();
  const contractorWorkFindMany = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    moulder: { findUnique: moulderFindUnique, findMany: moulderFindMany },
    production: { findMany: productionFindMany },
    payment: { findMany: paymentFindMany },
    contractorWork: { findMany: contractorWorkFindMany },
  } as unknown as PrismaService;
  const service = new BalancesService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({ id: 'campaign-id', kilnLoadingRate: 3 });
  });

  describe('moulders', () => {
    it('lists one line per moulder with entries, each computed from its own rows only', async () => {
      productionFindMany.mockResolvedValue([
        { moulderId: 'a', quantity: 1000, rate: 20 },
        { moulderId: 'b', quantity: 500, rate: 20 },
        { moulderId: 'a', quantity: 200, rate: 20 },
      ]);
      paymentFindMany.mockResolvedValue([
        { moulderId: 'a', type: 'vatsy', amount: 4000 },
        { moulderId: 'c', type: 'advance', amount: 1000 },
      ]);
      moulderFindMany.mockResolvedValue([
        { id: 'a', name: 'Rakoto' },
        { id: 'b', name: 'Rasoa' },
        { id: 'c', name: 'Solo' },
      ]);
      const lines = await service.moulders('campaign-id');
      expect(moulderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ['a', 'b', 'c'] } } }),
      );
      expect(lines.map((l) => [l.name, l.bricks, l.paid, l.due])).toEqual([
        ['Rakoto', 1200, 4000, 20000],
        ['Rasoa', 500, 0, 10000],
        ['Solo', 0, 1000, -1000],
      ]);
    });

    it('only counts live entries and moulder payments', async () => {
      productionFindMany.mockResolvedValue([]);
      paymentFindMany.mockResolvedValue([]);
      moulderFindMany.mockResolvedValue([]);
      await service.moulders('campaign-id');
      expect(productionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { campaignId: 'campaign-id', cancelledAt: null } }),
      );
      expect(paymentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-id', moulderId: { not: null }, cancelledAt: null },
        }),
      );
    });

    it('returns zeros for a known moulder without entries, 404 for an unknown one', async () => {
      moulderFindUnique.mockResolvedValue({ id: 'a', name: 'Rakoto' });
      productionFindMany.mockResolvedValue([]);
      paymentFindMany.mockResolvedValue([]);
      await expect(service.moulder('campaign-id', 'a')).resolves.toMatchObject({
        moulderId: 'a',
        name: 'Rakoto',
        due: 0,
      });
      moulderFindUnique.mockResolvedValue(null);
      await rejectsWithCode(service.moulder('campaign-id', 'x'), 'moulder_not_found');
    });
  });

  describe('contractors', () => {
    it('lists names from works and payments alike, sorted, each at the rate of its type', async () => {
      contractorWorkFindMany.mockResolvedValue([
        { contractorName: 'Solo', type: 'transport', quantity: 40000, rate: 5 },
        { contractorName: 'Bema', type: 'kiln_loading', quantity: 40000, rate: null },
      ]);
      paymentFindMany.mockResolvedValue([
        { contractorName: 'Solo', type: 'advance', amount: 50000 },
        { contractorName: 'Naina', type: 'advance', amount: 10000 },
      ]);
      const lines = await service.contractors('campaign-id');
      expect(lines.map((l) => [l.contractorName, l.earned, l.paid, l.due])).toEqual([
        ['Bema', 120000, 0, 120000],
        ['Naina', 0, 10000, -10000],
        ['Solo', 200000, 50000, 150000],
      ]);
      expect(paymentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-id', contractorName: { not: null }, cancelledAt: null },
        }),
      );
    });

    it('404s on a name with no entry in the campaign', async () => {
      contractorWorkFindMany.mockResolvedValue([]);
      paymentFindMany.mockResolvedValue([]);
      await rejectsWithCode(service.contractor('campaign-id', 'Nobody'), 'contractor_not_found');
    });
  });

  it('throws 404 when the campaign does not exist', async () => {
    campaignFindUnique.mockResolvedValue(null);
    await rejectsWithCode(service.moulders('missing'), 'campaign_not_found');
    await rejectsWithCode(service.contractors('missing'), 'campaign_not_found');
  });
});
