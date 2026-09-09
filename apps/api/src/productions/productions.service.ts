import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateProductionDto,
  ListProductionsQuery,
  ProductionDto,
  UpdateProductionDto,
} from './production.dto.js';
import { type CampaignWindow, isWithinCampaign } from './production.rules.js';

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
  constructor(private readonly prisma: PrismaService) {}

  async create(campaignId: string, input: CreateProductionDto): Promise<ProductionDto> {
    const campaign = await this.getCampaign(campaignId);
    this.assertWithinCampaign(campaign, input.date);
    await this.assertActiveMoulder(input.moulderId);
    await this.assertRiceField(input.riceFieldId);
    const row = await this.prisma.production.create({
      data: { ...input, campaignId, date: parseDateOnly(input.date) },
      select: productionSelect,
    });
    return toDto(row);
  }

  async findAll(campaignId: string, query: ListProductionsQuery): Promise<ProductionDto[]> {
    await this.getCampaign(campaignId);
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
      this.assertWithinCampaign(await this.getCampaign(campaignId), input.date);
    }
    if (input.moulderId !== undefined) await this.assertActiveMoulder(input.moulderId);
    if (input.riceFieldId !== undefined) await this.assertRiceField(input.riceFieldId);
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

  private async getCampaign(id: string): Promise<CampaignWindow> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      select: { startedOn: true, closedOn: true },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return {
      startedOn: formatDateOnly(campaign.startedOn),
      closedOn: campaign.closedOn === null ? null : formatDateOnly(campaign.closedOn),
    };
  }

  private assertWithinCampaign(campaign: CampaignWindow, date: string): void {
    if (!isWithinCampaign(campaign, date)) {
      throw new BadRequestException('date must fall within the campaign');
    }
  }

  /** References in the body are input, so a bad one is a 400, not a 404. */
  private async assertActiveMoulder(id: string): Promise<void> {
    const moulder = await this.prisma.moulder.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!moulder) throw new BadRequestException(`Unknown moulder ${id}`);
    if (!moulder.active) throw new BadRequestException(`Moulder ${id} is inactive`);
  }

  private async assertRiceField(id: string): Promise<void> {
    const field = await this.prisma.riceField.findUnique({ where: { id }, select: { id: true } });
    if (!field) throw new BadRequestException(`Unknown rice field ${id}`);
  }
}

function toDto(row: ProductionRow): ProductionDto {
  return { ...row, date: formatDateOnly(row.date) };
}
