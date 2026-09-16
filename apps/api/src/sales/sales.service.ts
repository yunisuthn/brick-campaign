import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSaleDto, SaleDto, UpdateSaleDto } from './sale.dto.js';
import { saleStatus, saleTotal } from './sale.rules.js';

const saleSelect = {
  id: true,
  campaignId: true,
  clientId: true,
  date: true,
  orderedQuantity: true,
  unitPrice: true,
} satisfies Prisma.SaleSelect;

type SaleRow = Prisma.SaleGetPayload<{ select: typeof saleSelect }>;

/** What a sale has taken in and sent out, summed from its own rows. */
interface SaleProgressSums {
  delivered: number;
  received: number;
}

const NOTHING_YET: SaleProgressSums = { delivered: 0, received: 0 };

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
  ) {}

  async create(campaignId: string, input: CreateSaleDto): Promise<SaleDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.date);
    await this.refs.assertClient(input.clientId);
    const row = await this.prisma.sale.create({
      data: {
        campaignId,
        clientId: input.clientId,
        date: parseDateOnly(input.date),
        orderedQuantity: input.orderedQuantity,
        unitPrice: input.unitPrice,
      },
      select: saleSelect,
    });
    // Nothing delivered and nothing received: the sale was just created.
    return toDto(row, NOTHING_YET);
  }

  async findAll(campaignId: string): Promise<SaleDto[]> {
    await this.refs.campaignWindow(campaignId);
    const [rows, delivered, received] = await Promise.all([
      this.prisma.sale.findMany({
        where: { campaignId, cancelledAt: null },
        select: saleSelect,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      this.deliveredPerSale(campaignId),
      this.receivedPerSale(campaignId),
    ]);
    return rows.map((row) =>
      toDto(row, { delivered: delivered.get(row.id) ?? 0, received: received.get(row.id) ?? 0 }),
    );
  }

  /** A cancelled sale is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<SaleDto> {
    const row = await this.prisma.sale.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: saleSelect,
    });
    if (!row) throw apiError('sale_not_found', `Sale ${id} not found`);
    return toDto(row, await this.sumsFor(id));
  }

  async update(campaignId: string, id: string, input: UpdateSaleDto): Promise<SaleDto> {
    const current = await this.findOne(campaignId, id);
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), input.date);
    }
    if (input.clientId !== undefined) await this.refs.assertClient(input.clientId);
    const row = await this.prisma.sale.update({
      where: { id },
      data: {
        clientId: input.clientId,
        date: input.date === undefined ? undefined : parseDateOnly(input.date),
        orderedQuantity: input.orderedQuantity,
        unitPrice: input.unitPrice,
      },
      select: saleSelect,
    });
    return toDto(row, {
      delivered: current.deliveredQuantity,
      received: current.receivedAmount,
    });
  }

  /** Trips and instalments point at the sale: they are cancelled first, or the sale stays. */
  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    const [liveDeliveries, livePayments] = await Promise.all([
      this.prisma.delivery.count({ where: { saleId: id, cancelledAt: null } }),
      this.prisma.salePayment.count({ where: { saleId: id, cancelledAt: null } }),
    ]);
    if (liveDeliveries > 0) {
      throw apiError(
        'sale_has_deliveries',
        `Sale ${id} still has ${liveDeliveries} delivery(ies)`,
        {
          deliveries: liveDeliveries,
        },
      );
    }
    if (livePayments > 0) {
      throw apiError('sale_has_payments', `Sale ${id} still has ${livePayments} payment(s)`, {
        payments: livePayments,
      });
    }
    await this.prisma.sale.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /** One query for the whole list: live deliveries summed per sale of the campaign. */
  private async deliveredPerSale(campaignId: string): Promise<Map<string, number>> {
    const groups = await this.prisma.delivery.groupBy({
      by: ['saleId'],
      where: { sale: { campaignId }, cancelledAt: null },
      _sum: { quantity: true },
    });
    return new Map(groups.map((group) => [group.saleId, group._sum.quantity ?? 0]));
  }

  /** Same, for the instalments received. */
  private async receivedPerSale(campaignId: string): Promise<Map<string, number>> {
    const groups = await this.prisma.salePayment.groupBy({
      by: ['saleId'],
      where: { sale: { campaignId }, cancelledAt: null },
      _sum: { amount: true },
    });
    return new Map(groups.map((group) => [group.saleId, group._sum.amount ?? 0]));
  }

  private async sumsFor(saleId: string): Promise<SaleProgressSums> {
    const [delivered, received] = await Promise.all([
      this.prisma.delivery.aggregate({
        where: { saleId, cancelledAt: null },
        _sum: { quantity: true },
      }),
      this.prisma.salePayment.aggregate({
        where: { saleId, cancelledAt: null },
        _sum: { amount: true },
      }),
    ]);
    return { delivered: delivered._sum.quantity ?? 0, received: received._sum.amount ?? 0 };
  }
}

function toDto(row: SaleRow, sums: SaleProgressSums): SaleDto {
  const total = saleTotal(row.orderedQuantity, row.unitPrice);
  return {
    ...row,
    date: formatDateOnly(row.date),
    deliveredQuantity: sums.delivered,
    receivedAmount: sums.received,
    total,
    // An instalment is never allowed past the total, so this never goes below zero.
    outstanding: total - sums.received,
    status: saleStatus({
      orderedQuantity: row.orderedQuantity,
      unitPrice: row.unitPrice,
      deliveredQuantity: sums.delivered,
      receivedAmount: sums.received,
    }),
  };
}
