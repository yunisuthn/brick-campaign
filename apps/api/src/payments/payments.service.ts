import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreatePaymentDto,
  ListPaymentsQuery,
  PaymentDto,
  UpdatePaymentDto,
} from './payment.dto.js';

const paymentSelect = {
  id: true,
  campaignId: true,
  moulderId: true,
  contractorName: true,
  type: true,
  date: true,
  amount: true,
} satisfies Prisma.PaymentSelect;

type PaymentRow = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
  ) {}

  async create(campaignId: string, input: CreatePaymentDto): Promise<PaymentDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.date);
    const { moulderId, contractorName, ...rest } = input;
    if (moulderId !== undefined) await this.refs.assertActiveMoulder(moulderId);
    const row = await this.prisma.payment.create({
      data: {
        ...rest,
        campaignId,
        date: parseDateOnly(input.date),
        moulderId: moulderId ?? null,
        contractorName: contractorName ?? null,
      },
      select: paymentSelect,
    });
    return toDto(row);
  }

  async findAll(campaignId: string, query: ListPaymentsQuery): Promise<PaymentDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.payment.findMany({
      where: {
        campaignId,
        cancelledAt: null,
        moulderId: query.moulderId,
        contractorName: query.contractorName,
        date: {
          gte: query.from === undefined ? undefined : parseDateOnly(query.from),
          lte: query.to === undefined ? undefined : parseDateOnly(query.to),
        },
      },
      select: paymentSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled entry is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<PaymentDto> {
    const row = await this.prisma.payment.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: paymentSelect,
    });
    if (!row) throw new NotFoundException(`Payment ${id} not found`);
    return toDto(row);
  }

  async update(campaignId: string, id: string, input: UpdatePaymentDto): Promise<PaymentDto> {
    await this.findOne(campaignId, id);
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), input.date);
    }
    const { moulderId, contractorName, ...rest } = input;
    const data: Prisma.PaymentUncheckedUpdateInput = {
      ...rest,
      date: input.date === undefined ? undefined : parseDateOnly(input.date),
    };
    // A new beneficiary replaces the old one, whichever kind it was.
    if (moulderId !== undefined) {
      await this.refs.assertActiveMoulder(moulderId);
      Object.assign(data, { moulderId, contractorName: null });
    } else if (contractorName !== undefined) {
      Object.assign(data, { moulderId: null, contractorName });
    }
    const row = await this.prisma.payment.update({ where: { id }, data, select: paymentSelect });
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.payment.update({ where: { id }, data: { cancelledAt: new Date() } });
  }
}

function toDto(row: PaymentRow): PaymentDto {
  return { ...row, date: formatDateOnly(row.date) };
}
