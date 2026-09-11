import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from '../sales/sales.service.js';
import { StockService } from '../stock/stock.service.js';
import type { CreateDeliveryDto, DeliveryDto, UpdateDeliveryDto } from './delivery.dto.js';

const deliverySelect = {
  id: true,
  saleId: true,
  date: true,
  quantity: true,
  cost: true,
  plate: true,
} satisfies Prisma.DeliverySelect;

type DeliveryRow = Prisma.DeliveryGetPayload<{ select: typeof deliverySelect }>;

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
    private readonly sales: SalesService,
    private readonly stock: StockService,
  ) {}

  async create(campaignId: string, saleId: string, input: CreateDeliveryDto): Promise<DeliveryDto> {
    const sale = await this.sales.findOne(campaignId, saleId);
    await this.assertDate(campaignId, sale.date, input.date);
    await this.assertFiredStockCovers(campaignId, input.quantity);
    const row = await this.prisma.delivery.create({
      data: { ...input, saleId, date: parseDateOnly(input.date) },
      select: deliverySelect,
    });
    return toDto(row);
  }

  /** Trips in the order they were made: the first one first. */
  async findAll(campaignId: string, saleId: string): Promise<DeliveryDto[]> {
    await this.sales.findOne(campaignId, saleId);
    const rows = await this.prisma.delivery.findMany({
      where: { saleId, cancelledAt: null },
      select: deliverySelect,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled delivery is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, saleId: string, id: string): Promise<DeliveryDto> {
    const row = await this.prisma.delivery.findFirst({
      where: { id, saleId, cancelledAt: null, sale: { campaignId, cancelledAt: null } },
      select: deliverySelect,
    });
    if (!row) throw apiError('delivery_not_found', `Delivery ${id} not found`);
    return toDto(row);
  }

  async update(
    campaignId: string,
    saleId: string,
    id: string,
    input: UpdateDeliveryDto,
  ): Promise<DeliveryDto> {
    const current = await this.findOne(campaignId, saleId, id);
    if (input.date !== undefined) {
      const sale = await this.sales.findOne(campaignId, saleId);
      await this.assertDate(campaignId, sale.date, input.date);
    }
    if (input.quantity !== undefined && input.quantity !== current.quantity) {
      await this.assertFiredStockCovers(campaignId, input.quantity, id);
    }
    const row = await this.prisma.delivery.update({
      where: { id },
      data: {
        ...input,
        date: input.date === undefined ? undefined : parseDateOnly(input.date),
      },
      select: deliverySelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, saleId: string, id: string): Promise<void> {
    await this.findOne(campaignId, saleId, id);
    await this.prisma.delivery.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /** A trip happens inside the campaign and never before the sale it serves. */
  private async assertDate(campaignId: string, saleDate: string, date: string): Promise<void> {
    this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), date);
    if (date < saleDate)
      throw apiError('delivery_before_sale', 'date must not be before the sale date');
  }

  /** Same decision as for kiln batches: delivering more than the fired stock is refused, the missing entry is fixed first. */
  private async assertFiredStockCovers(
    campaignId: string,
    quantity: number,
    excludingDeliveryId?: string,
  ): Promise<void> {
    const available = await this.stock.firedStock(campaignId, excludingDeliveryId);
    if (quantity > available) {
      throw apiError(
        'fired_stock_too_low',
        `Only ${available} fired bricks in stock, cannot deliver ${quantity}`,
        { available, quantity },
      );
    }
  }
}

function toDto(row: DeliveryRow): DeliveryDto {
  return { ...row, date: formatDateOnly(row.date) };
}
