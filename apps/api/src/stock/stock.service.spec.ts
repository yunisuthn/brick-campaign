import type { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from './stock.service.js';

describe('StockService.rawStock', () => {
  const productionAggregate = vi.fn();
  const kilnBatchAggregate = vi.fn();
  const prisma = {
    production: { aggregate: productionAggregate },
    kilnBatch: { aggregate: kilnBatchAggregate },
  } as unknown as PrismaService;
  const service = new StockService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
  });

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
