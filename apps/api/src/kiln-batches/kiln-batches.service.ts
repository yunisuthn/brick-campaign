import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from '../stock/stock.service.js';
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
    return toDto(row);
  }

  async findAll(campaignId: string): Promise<KilnBatchDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.kilnBatch.findMany({
      where: { campaignId, cancelledAt: null },
      select: kilnBatchSelect,
      orderBy: [{ loadedOn: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled batch is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<KilnBatchDto> {
    const row = await this.prisma.kilnBatch.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: kilnBatchSelect,
    });
    if (!row) throw new NotFoundException(`Kiln batch ${id} not found`);
    return toDto(row);
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
    return toDto(row);
  }

  /** Contractor works point at the batch: they are cancelled first, or the batch stays. */
  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    const liveWorks = await this.prisma.contractorWork.count({
      where: { kilnBatchId: id, cancelledAt: null },
    });
    if (liveWorks > 0) {
      throw new ConflictException(`Kiln batch ${id} still has ${liveWorks} contractor work(s)`);
    }
    await this.prisma.kilnBatch.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /** Decision with the owner: loading more than the raw stock is refused, a missing production entry is fixed first. */
  private async assertRawStockCovers(
    campaignId: string,
    quantity: number,
    excludingBatchId?: string,
  ): Promise<void> {
    const available = await this.stock.rawStock(campaignId, excludingBatchId);
    if (quantity > available) {
      throw new BadRequestException(
        `Only ${available} raw bricks in stock, cannot load ${quantity}`,
      );
    }
  }
}

function assertDatesOrdered(loadedOn: string, unloadedOn: string | null): void {
  if (unloadedOn !== null && unloadedOn < loadedOn) {
    throw new BadRequestException('unloadedOn must not be before loadedOn');
  }
}

function toDto(row: KilnBatchRow): KilnBatchDto {
  return {
    ...row,
    loadedOn: formatDateOnly(row.loadedOn),
    unloadedOn: row.unloadedOn === null ? null : formatDateOnly(row.unloadedOn),
  };
}
