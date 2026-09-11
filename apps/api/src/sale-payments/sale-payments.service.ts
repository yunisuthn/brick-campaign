import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from '../sales/sales.service.js';
import type {
  CreateSalePaymentDto,
  SalePaymentDto,
  UpdateSalePaymentDto,
} from './sale-payment.dto.js';

const salePaymentSelect = {
  id: true,
  saleId: true,
  date: true,
  amount: true,
} satisfies Prisma.SalePaymentSelect;

type SalePaymentRow = Prisma.SalePaymentGetPayload<{ select: typeof salePaymentSelect }>;

@Injectable()
export class SalePaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
    private readonly sales: SalesService,
  ) {}

  async create(
    campaignId: string,
    saleId: string,
    input: CreateSalePaymentDto,
  ): Promise<SalePaymentDto> {
    const sale = await this.sales.findOne(campaignId, saleId);
    await this.assertDate(campaignId, sale.date, input.date);
    this.assertWithinTotal(sale.outstanding, input.amount);
    const row = await this.prisma.salePayment.create({
      data: { ...input, saleId, date: parseDateOnly(input.date) },
      select: salePaymentSelect,
    });
    return toDto(row);
  }

  /** Instalments in the order they came in: the first one first. */
  async findAll(campaignId: string, saleId: string): Promise<SalePaymentDto[]> {
    await this.sales.findOne(campaignId, saleId);
    const rows = await this.prisma.salePayment.findMany({
      where: { saleId, cancelledAt: null },
      select: salePaymentSelect,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled instalment is gone from the API: reading or cancelling it again is a 404. */
  async findOne(campaignId: string, saleId: string, id: string): Promise<SalePaymentDto> {
    const row = await this.prisma.salePayment.findFirst({
      where: { id, saleId, cancelledAt: null, sale: { campaignId, cancelledAt: null } },
      select: salePaymentSelect,
    });
    if (!row) throw apiError('sale_payment_not_found', `Sale payment ${id} not found`);
    return toDto(row);
  }

  async update(
    campaignId: string,
    saleId: string,
    id: string,
    input: UpdateSalePaymentDto,
  ): Promise<SalePaymentDto> {
    const current = await this.findOne(campaignId, saleId, id);
    const sale = await this.sales.findOne(campaignId, saleId);
    if (input.date !== undefined) await this.assertDate(campaignId, sale.date, input.date);
    if (input.amount !== undefined && input.amount !== current.amount) {
      // What is left, this instalment aside: raising it to that is allowed, past it is not.
      this.assertWithinTotal(sale.outstanding + current.amount, input.amount);
    }
    const row = await this.prisma.salePayment.update({
      where: { id },
      data: {
        ...input,
        date: input.date === undefined ? undefined : parseDateOnly(input.date),
      },
      select: salePaymentSelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, saleId: string, id: string): Promise<void> {
    await this.findOne(campaignId, saleId, id);
    await this.prisma.salePayment.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /** An instalment falls inside the campaign and never before the sale it settles. */
  private async assertDate(campaignId: string, saleDate: string, date: string): Promise<void> {
    this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), date);
    if (date < saleDate) {
      throw apiError('sale_payment_before_sale', 'date must not be before the sale date');
    }
  }

  /**
   * Reference document, section 10.5: more than the sale is worth means a wrong amount or a
   * wrong price, and that is corrected where it is rather than carried as an overpayment.
   */
  private assertWithinTotal(remaining: number, amount: number): void {
    if (amount > remaining) {
      throw apiError('sale_overpaid', `Only ${remaining} left to pay, cannot receive ${amount}`, {
        remaining,
        amount,
      });
    }
  }
}

function toDto(row: SalePaymentRow): SalePaymentDto {
  return { ...row, date: formatDateOnly(row.date) };
}
