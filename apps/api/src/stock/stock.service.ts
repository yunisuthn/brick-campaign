import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
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

  /** Pass `excludingDeliveryId` when re-checking a delivery being corrected, so its own quantity is not counted. */
  async firedStock(campaignId: string, excludingDeliveryId?: string): Promise<number> {
    const [unloaded, delivered] = await Promise.all([
      this.unloaded(campaignId),
      this.delivered(campaignId, excludingDeliveryId),
    ]);
    return unloaded - delivered;
  }

  async overview(campaignId: string): Promise<StockDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) throw apiError('campaign_not_found', `Campaign ${campaignId} not found`);
    const [produced, loaded, unloaded, delivered] = await Promise.all([
      this.produced(campaignId),
      this.loaded(campaignId),
      this.unloaded(campaignId),
      this.delivered(campaignId),
    ]);
    const counts: StockCounts = { produced, loaded, unloaded, delivered };
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

  /** Deliveries reach the campaign through their sale. */
  private async delivered(campaignId: string, excludingDeliveryId?: string): Promise<number> {
    const result = await this.prisma.delivery.aggregate({
      where: {
        sale: { campaignId },
        cancelledAt: null,
        id: excludingDeliveryId === undefined ? undefined : { not: excludingDeliveryId },
      },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}
