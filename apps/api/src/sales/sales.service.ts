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
import type { CreateSaleDto, SaleDto, SalePaymentDto, UpdateSaleDto } from './sale.dto.js';
import { saleStatus, saleTotal } from './sale.rules.js';

const saleSelect = {
  id: true,
  campaignId: true,
  clientId: true,
  date: true,
  orderedQuantity: true,
  unitPrice: true,
  paidOn: true,
  amountReceived: true,
} satisfies Prisma.SaleSelect;

type SaleRow = Prisma.SaleGetPayload<{ select: typeof saleSelect }>;

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
    assertPaidAfterSale(input.date, input.payment);
    const row = await this.prisma.sale.create({
      data: {
        campaignId,
        clientId: input.clientId,
        date: parseDateOnly(input.date),
        orderedQuantity: input.orderedQuantity,
        unitPrice: input.unitPrice,
        ...paymentColumns(input.payment),
      },
      select: saleSelect,
    });
    // Nothing delivered yet: the sale was just created.
    return toDto(row, 0);
  }

  async findAll(campaignId: string): Promise<SaleDto[]> {
    await this.refs.campaignWindow(campaignId);
    const [rows, delivered] = await Promise.all([
      this.prisma.sale.findMany({
        where: { campaignId, cancelledAt: null },
        select: saleSelect,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      this.deliveredPerSale(campaignId),
    ]);
    return rows.map((row) => toDto(row, delivered.get(row.id) ?? 0));
  }

  /** A cancelled sale is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<SaleDto> {
    const row = await this.prisma.sale.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: saleSelect,
    });
    if (!row) throw new NotFoundException(`Sale ${id} not found`);
    return toDto(row, await this.deliveredFor(id));
  }

  /** Recording the payment is a correction that sets `payment`; rules are checked on the merged state. */
  async update(campaignId: string, id: string, input: UpdateSaleDto): Promise<SaleDto> {
    const current = await this.findOne(campaignId, id);
    const date = input.date ?? current.date;
    const payment = input.payment === undefined ? current.payment : input.payment;
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), date);
    }
    if (input.clientId !== undefined) await this.refs.assertClient(input.clientId);
    assertPaidAfterSale(date, payment);
    const row = await this.prisma.sale.update({
      where: { id },
      data: {
        clientId: input.clientId,
        date: parseDateOnly(date),
        orderedQuantity: input.orderedQuantity,
        unitPrice: input.unitPrice,
        ...paymentColumns(payment),
      },
      select: saleSelect,
    });
    return toDto(row, current.deliveredQuantity);
  }

  /** Deliveries point at the sale: they are cancelled first, or the sale stays. */
  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    const liveDeliveries = await this.prisma.delivery.count({
      where: { saleId: id, cancelledAt: null },
    });
    if (liveDeliveries > 0) {
      throw new ConflictException(`Sale ${id} still has ${liveDeliveries} delivery(ies)`);
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

  private async deliveredFor(saleId: string): Promise<number> {
    const result = await this.prisma.delivery.aggregate({
      where: { saleId, cancelledAt: null },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}

function assertPaidAfterSale(date: string, payment: SalePaymentDto | null): void {
  if (payment !== null && payment.paidOn < date) {
    throw new BadRequestException('paidOn must not be before the sale date');
  }
}

/** Both columns move together: the CHECK constraint in the migration guards the same rule. */
function paymentColumns(
  payment: SalePaymentDto | null,
): Pick<SaleRow, 'paidOn' | 'amountReceived'> {
  return payment === null
    ? { paidOn: null, amountReceived: null }
    : { paidOn: parseDateOnly(payment.paidOn), amountReceived: payment.amountReceived };
}

function toDto(row: SaleRow, deliveredQuantity: number): SaleDto {
  const { paidOn, amountReceived, ...rest } = row;
  const payment =
    paidOn === null || amountReceived === null
      ? null
      : { paidOn: formatDateOnly(paidOn), amountReceived };
  return {
    ...rest,
    date: formatDateOnly(row.date),
    payment,
    deliveredQuantity,
    total: saleTotal(row.orderedQuantity, row.unitPrice),
    status: saleStatus({
      orderedQuantity: row.orderedQuantity,
      deliveredQuantity,
      paid: payment !== null,
    }),
  };
}
