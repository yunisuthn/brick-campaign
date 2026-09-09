import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Stock is never stored (reference document, section 5): it is the sum of the live entries.
 * Raw bricks = produced - loaded into a kiln. Fired bricks come with deliveries (section 4).
 */
@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass `excludingBatchId` when re-checking a batch being corrected, so its own quantity is not counted. */
  async rawStock(campaignId: string, excludingBatchId?: string): Promise<number> {
    const [produced, loaded] = await Promise.all([
      this.prisma.production.aggregate({
        where: { campaignId, cancelledAt: null },
        _sum: { quantity: true },
      }),
      this.prisma.kilnBatch.aggregate({
        where: {
          campaignId,
          cancelledAt: null,
          id: excludingBatchId === undefined ? undefined : { not: excludingBatchId },
        },
        _sum: { quantity: true },
      }),
    ]);
    return (produced._sum.quantity ?? 0) - (loaded._sum.quantity ?? 0);
  }
}
