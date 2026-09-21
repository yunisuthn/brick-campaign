import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
import { type KilnBatchCost, kilnBatchCost, NO_COST } from './kiln-batch-cost.js';
import type { CreateKilnBatchDto, KilnBatchDto, UpdateKilnBatchDto } from './kiln-batch.dto.js';

const kilnBatchSelect = {
  id: true,
  campaignId: true,
  loadedOn: true,
  unloadedOn: true,
  quantity: true,
} satisfies Prisma.KilnBatchSelect;

type KilnBatchRow = Prisma.KilnBatchGetPayload<{ select: typeof kilnBatchSelect }>;

@Injectable()
export class KilnBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
    private readonly stock: StockService,
  ) {}

  async create(campaignId: string, input: CreateKilnBatchDto): Promise<KilnBatchDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.loadedOn);
    assertDatesOrdered(input.loadedOn, input.unloadedOn);
    await this.assertRawStockCovers(campaignId, input.quantity);
    const row = await this.prisma.kilnBatch.create({
      data: {
        campaignId,
        quantity: input.quantity,
        loadedOn: parseDateOnly(input.loadedOn),
        unloadedOn: input.unloadedOn === null ? null : parseDateOnly(input.unloadedOn),
      },
      select: kilnBatchSelect,
    });
    return toDto(row, NO_COST);
  }

  async findAll(campaignId: string): Promise<KilnBatchDto[]> {
    const [rows, costs] = await Promise.all([
      this.prisma.kilnBatch.findMany({
        where: { campaignId, cancelledAt: null },
        select: kilnBatchSelect,
        orderBy: [{ loadedOn: 'desc' }, { createdAt: 'desc' }],
      }),
      this.costsByBatch(campaignId),
    ]);
    return rows.map((row) => toDto(row, costs.get(row.id) ?? NO_COST));
  }

  /** A cancelled batch is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<KilnBatchDto> {
    const row = await this.prisma.kilnBatch.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: kilnBatchSelect,
    });
    if (!row) throw apiError('kiln_batch_not_found', `Kiln batch ${id} not found`);
    const costs = await this.costsByBatch(campaignId, id);
    return toDto(row, costs.get(id) ?? NO_COST);
  }

  /** Unloading a batch is a correction that sets `unloadedOn`; rules are checked on the merged state. */
  async update(campaignId: string, id: string, input: UpdateKilnBatchDto): Promise<KilnBatchDto> {
    const current = await this.findOne(campaignId, id);
    const loadedOn = input.loadedOn ?? current.loadedOn;
    const unloadedOn = input.unloadedOn === undefined ? current.unloadedOn : input.unloadedOn;
    if (input.loadedOn !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), loadedOn);
    }
    assertDatesOrdered(loadedOn, unloadedOn);
    if (input.quantity !== undefined && input.quantity !== current.quantity) {
      await this.assertRawStockCovers(campaignId, input.quantity, id);
    }
    const row = await this.prisma.kilnBatch.update({
      where: { id },
      data: {
        quantity: input.quantity,
        loadedOn: parseDateOnly(loadedOn),
        unloadedOn: unloadedOn === null ? null : parseDateOnly(unloadedOn),
      },
      select: kilnBatchSelect,
    });
    return toDto(row, current.cost);
  }

  /** Contractor works point at the batch: they are cancelled first, or the batch stays. */
  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    const liveWorks = await this.prisma.contractorWork.count({
      where: { kilnBatchId: id, cancelledAt: null },
    });
    if (liveWorks > 0) {
      throw apiError(
        'kiln_batch_has_works',
        `Kiln batch ${id} still has ${liveWorks} contractor work(s)`,
        { works: liveWorks },
      );
    }
    await this.prisma.kilnBatch.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /**
   * Cost of every batch of the campaign (or of one batch) in three queries, whatever the number
   * of batches: rates, linked expenses summed per batch, works summed per batch and type.
   * Nothing is stored (reference document, section 5). An unknown campaign is a 404.
   */
  private async costsByBatch(
    campaignId: string,
    kilnBatchId?: string,
  ): Promise<Map<string, KilnBatchCost>> {
    const [rates, expenses, works] = await Promise.all([
      this.rates(campaignId),
      this.prisma.expense.groupBy({
        by: ['kilnBatchId'],
        where: { campaignId, kilnBatchId: kilnBatchId ?? { not: null }, cancelledAt: null },
        _sum: { amount: true },
      }),
      this.prisma.contractorWork.findMany({
        where: { campaignId, kilnBatchId, cancelledAt: null },
        select: { kilnBatchId: true, type: true, quantity: true, rate: true },
      }),
    ]);
    const ids = new Set([
      ...expenses.flatMap((g) => g.kilnBatchId ?? []),
      ...works.map((w) => w.kilnBatchId),
    ]);
    return new Map(
      [...ids].map((id) => [
        id,
        kilnBatchCost(
          rates,
          expenses.filter((g) => g.kilnBatchId === id).map((g) => ({ amount: g._sum.amount ?? 0 })),
          works.filter((w) => w.kilnBatchId === id),
        ),
      ]),
    );
  }

  private async rates(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { kilnLoadingRate: true },
    });
    if (!campaign) throw apiError('campaign_not_found', `Campaign ${campaignId} not found`);
    return campaign;
  }

  /** Decision with the owner: loading more than the raw stock is refused, a missing production entry is fixed first. */
  private async assertRawStockCovers(
    campaignId: string,
    quantity: number,
    excludingBatchId?: string,
  ): Promise<void> {
    const available = await this.stock.rawStock(campaignId, excludingBatchId);
    if (quantity > available) {
      throw apiError(
        'raw_stock_too_low',
        `Only ${available} raw bricks in stock, cannot load ${quantity}`,
        { available, quantity },
      );
    }
  }
}

function assertDatesOrdered(loadedOn: string, unloadedOn: string | null): void {
  if (unloadedOn !== null && unloadedOn < loadedOn) {
    throw apiError('batch_dates_out_of_order', 'unloadedOn must not be before loadedOn');
  }
}

function toDto(row: KilnBatchRow, cost: KilnBatchCost): KilnBatchDto {
  return {
    ...row,
    loadedOn: formatDateOnly(row.loadedOn),
    unloadedOn: row.unloadedOn === null ? null : formatDateOnly(row.unloadedOn),
    cost,
  };
}
