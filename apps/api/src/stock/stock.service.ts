import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { type StockCounts, type StockLevels, stockLevels } from './stock.rules.js';

export interface StockDto extends StockCounts, StockLevels {
  campaignId: string;
}

/**
 * Stock is never stored (reference document, section 5): it is the sum of the live entries,
 * so a corrected or cancelled entry is reflected immediately.
 */
@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass `excludingBatchId` when re-checking a batch being corrected, so its own quantity is not counted. */
  async rawStock(campaignId: string, excludingBatchId?: string): Promise<number> {
    const [produced, loaded] = await Promise.all([
      this.produced(campaignId),
      this.loaded(campaignId, excludingBatchId),
    ]);
    return produced - loaded;
  }

  async overview(campaignId: string): Promise<StockDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);
    const [produced, loaded, unloaded] = await Promise.all([
      this.produced(campaignId),
      this.loaded(campaignId),
      this.unloaded(campaignId),
    ]);
    // Deliveries come with step 5 of the roadmap; until then nothing has left the fired stock.
    const counts: StockCounts = { produced, loaded, unloaded, delivered: 0 };
    return { campaignId, ...counts, ...stockLevels(counts) };
  }

  private async produced(campaignId: string): Promise<number> {
    const result = await this.prisma.production.aggregate({
      where: { campaignId, cancelledAt: null },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async loaded(campaignId: string, excludingBatchId?: string): Promise<number> {
    const result = await this.prisma.kilnBatch.aggregate({
      where: {
        campaignId,
        cancelledAt: null,
        id: excludingBatchId === undefined ? undefined : { not: excludingBatchId },
      },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async unloaded(campaignId: string): Promise<number> {
    const result = await this.prisma.kilnBatch.aggregate({
      where: { campaignId, cancelledAt: null, unloadedOn: { not: null } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
