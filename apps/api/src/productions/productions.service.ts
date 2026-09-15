import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
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
  startedOn: true,
  endedOn: true,
  quantity: true,
  rate: true,
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
    this.refs.assertWithinCampaign(campaign, input.startedOn);
    assertDatesOrdered(input.startedOn, input.endedOn);
    await this.refs.assertActiveMoulder(input.moulderId);
    await this.refs.assertRiceField(input.riceFieldId);
    await this.refs.assertMouldingRate(campaignId, input.rate);
    const row = await this.prisma.production.create({
      data: {
        ...input,
        campaignId,
        startedOn: parseDateOnly(input.startedOn),
        endedOn: input.endedOn === null ? null : parseDateOnly(input.endedOn),
      },
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
        startedOn: {
          gte: query.from === undefined ? undefined : parseDateOnly(query.from),
          lte: query.to === undefined ? undefined : parseDateOnly(query.to),
        },
      },
      select: productionSelect,
      orderBy: [{ startedOn: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled entry is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<ProductionDto> {
    const row = await this.prisma.production.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: productionSelect,
    });
    if (!row) throw apiError('production_not_found', `Production ${id} not found`);
    return toDto(row);
  }

  async update(campaignId: string, id: string, input: UpdateProductionDto): Promise<ProductionDto> {
    const current = await this.findOne(campaignId, id);
    const startedOn = input.startedOn ?? current.startedOn;
    const endedOn = input.endedOn === undefined ? current.endedOn : input.endedOn;
    if (input.startedOn !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), startedOn);
    }
    assertDatesOrdered(startedOn, endedOn);
    if (input.moulderId !== undefined) await this.refs.assertActiveMoulder(input.moulderId);
    if (input.riceFieldId !== undefined) await this.refs.assertRiceField(input.riceFieldId);
    if (input.rate !== undefined) await this.refs.assertMouldingRate(campaignId, input.rate);
    const row = await this.prisma.production.update({
      where: { id },
      data: {
        ...input,
        startedOn: parseDateOnly(startedOn),
        endedOn: endedOn === null ? null : parseDateOnly(endedOn),
      },
      select: productionSelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.production.update({ where: { id }, data: { cancelledAt: new Date() } });
  }
}

/** Reference document, section 5, same rule as a kiln batch's loadedOn/unloadedOn. */
function assertDatesOrdered(startedOn: string, endedOn: string | null): void {
  if (endedOn !== null && endedOn < startedOn) {
    throw apiError('production_dates_out_of_order', 'endedOn must not be before startedOn');
  }
}

function toDto(row: ProductionRow): ProductionDto {
  return {
    ...row,
    startedOn: formatDateOnly(row.startedOn),
    endedOn: row.endedOn === null ? null : formatDateOnly(row.endedOn),
  };
}
