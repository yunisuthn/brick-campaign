import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from './stock.service.js';

describe('StockService', () => {
  const campaignFindUnique = vi.fn();
  const productionAggregate = vi.fn();
  const kilnBatchAggregate = vi.fn();
  const deliveryAggregate = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    production: { aggregate: productionAggregate },
    kilnBatch: { aggregate: kilnBatchAggregate },
    delivery: { aggregate: deliveryAggregate },
  } as unknown as PrismaService;
  const service = new StockService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({ id: 'campaign-id' });
    deliveryAggregate.mockResolvedValue({ _sum: { quantity: null } });
  });

  describe('rawStock', () => {
    it('is produced minus loaded, counting live entries only', async () => {
      productionAggregate.mockResolvedValue({ _sum: { quantity: 100000 } });
      kilnBatchAggregate.mockResolvedValue({ _sum: { quantity: 40000 } });
      await expect(service.rawStock('campaign-id')).resolves.toBe(60000);
      expect(productionAggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { campaignId: 'campaign-id', cancelledAt: null } }),
      );
      expect(kilnBatchAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-id', cancelledAt: null, id: undefined },
        }),
      );
    });

    it('is zero with no entries at all (sums come back null)', async () => {
      productionAggregate.mockResolvedValue({ _sum: { quantity: null } });
      kilnBatchAggregate.mockResolvedValue({ _sum: { quantity: null } });
      await expect(service.rawStock('campaign-id')).resolves.toBe(0);
    });

    it('can leave one batch out of the loaded total', async () => {
      productionAggregate.mockResolvedValue({ _sum: { quantity: 1 } });
      kilnBatchAggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      await service.rawStock('campaign-id', 'batch-id');
      expect(kilnBatchAggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: { not: 'batch-id' } }) }),
      );
    });
  });

  describe('firedStock', () => {
    it('is unloaded minus delivered, deliveries reached through their live sale', async () => {
      kilnBatchAggregate.mockResolvedValue({ _sum: { quantity: 40000 } });
      deliveryAggregate.mockResolvedValue({ _sum: { quantity: 2500 } });
      await expect(service.firedStock('campaign-id')).resolves.toBe(37500);
      expect(deliveryAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sale: { campaignId: 'campaign-id' }, cancelledAt: null, id: undefined },
        }),
      );
    });

    it('can leave one delivery out of the delivered total', async () => {
      kilnBatchAggregate.mockResolvedValue({ _sum: { quantity: 40000 } });
      deliveryAggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      await service.firedStock('campaign-id', 'delivery-id');
      expect(deliveryAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'delivery-id' } }),
        }),
      );
    });
  });

  describe('overview', () => {
    it('reports counts and levels, unloaded being the batches with a date', async () => {
      productionAggregate.mockResolvedValue({ _sum: { quantity: 130000 } });
      kilnBatchAggregate.mockImplementation(({ where }: { where: { unloadedOn?: unknown } }) =>
        Promise.resolve({ _sum: { quantity: where.unloadedOn === undefined ? 85000 : 40000 } }),
      );
      deliveryAggregate.mockResolvedValue({ _sum: { quantity: 2500 } });
      await expect(service.overview('campaign-id')).resolves.toEqual({
        campaignId: 'campaign-id',
        produced: 130000,
        loaded: 85000,
        unloaded: 40000,
        delivered: 2500,
        raw: 45000,
        inKiln: 45000,
        fired: 37500,
      });
      expect(kilnBatchAggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-id', cancelledAt: null, unloadedOn: { not: null } },
        }),
      );
    });

    it('throws 404 for an unknown campaign', async () => {
      campaignFindUnique.mockResolvedValue(null);
      await expect(service.overview('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
