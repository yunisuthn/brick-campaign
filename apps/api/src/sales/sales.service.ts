import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSaleDto, SaleDto, SalePaymentDto, UpdateSaleDto } from './sale.dto.js';

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
    return toDto(row);
  }

  async findAll(campaignId: string): Promise<SaleDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.sale.findMany({
      where: { campaignId, cancelledAt: null },
      select: saleSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled sale is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<SaleDto> {
    const row = await this.prisma.sale.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: saleSelect,
    });
    if (!row) throw new NotFoundException(`Sale ${id} not found`);
    return toDto(row);
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
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.sale.update({ where: { id }, data: { cancelledAt: new Date() } });
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

function toDto(row: SaleRow): SaleDto {
  const { paidOn, amountReceived, ...rest } = row;
  return {
    ...rest,
    date: formatDateOnly(row.date),
    payment:
      paidOn === null || amountReceived === null
        ? null
        : { paidOn: formatDateOnly(paidOn), amountReceived },
  };
}
