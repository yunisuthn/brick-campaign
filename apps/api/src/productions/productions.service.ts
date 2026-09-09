import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateProductionDto,
  ListProductionsQuery,
  ProductionDto,
  UpdateProductionDto,
} from './production.dto.js';

const productionSelect = {
  id: true,
  campaignId: true,
  moulderId: true,
  riceFieldId: true,
  date: true,
  quantity: true,
} satisfies Prisma.ProductionSelect;

type ProductionRow = Prisma.ProductionGetPayload<{ select: typeof productionSelect }>;

@Injectable()
export class ProductionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
  ) {}

  async create(campaignId: string, input: CreateProductionDto): Promise<ProductionDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.date);
    await this.refs.assertActiveMoulder(input.moulderId);
    await this.refs.assertRiceField(input.riceFieldId);
    const row = await this.prisma.production.create({
      data: { ...input, campaignId, date: parseDateOnly(input.date) },
      select: productionSelect,
    });
    return toDto(row);
  }

  async findAll(campaignId: string, query: ListProductionsQuery): Promise<ProductionDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.production.findMany({
      where: {
        campaignId,
        cancelledAt: null,
        moulderId: query.moulderId,
        date: {
          gte: query.from === undefined ? undefined : parseDateOnly(query.from),
          lte: query.to === undefined ? undefined : parseDateOnly(query.to),
        },
      },
      select: productionSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled entry is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<ProductionDto> {
    const row = await this.prisma.production.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: productionSelect,
    });
    if (!row) throw new NotFoundException(`Production ${id} not found`);
    return toDto(row);
  }

  async update(campaignId: string, id: string, input: UpdateProductionDto): Promise<ProductionDto> {
    await this.findOne(campaignId, id);
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), input.date);
    }
    if (input.moulderId !== undefined) await this.refs.assertActiveMoulder(input.moulderId);
    if (input.riceFieldId !== undefined) await this.refs.assertRiceField(input.riceFieldId);
    const row = await this.prisma.production.update({
      where: { id },
      data: { ...input, date: input.date === undefined ? undefined : parseDateOnly(input.date) },
      select: productionSelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.production.update({ where: { id }, data: { cancelledAt: new Date() } });
  }
}

function toDto(row: ProductionRow): ProductionDto {
  return { ...row, date: formatDateOnly(row.date) };
}
