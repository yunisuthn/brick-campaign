import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreatePaymentDto,
  ListPaymentsQuery,
  PaymentDto,
  PaymentType,
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
    if (moulderId !== undefined) {
      await this.assertNoDuplicateType(campaignId, moulderId, input.type, input.date);
    }
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
    if (!row) throw apiError('payment_not_found', `Payment ${id} not found`);
    return toDto(row);
  }

  async update(campaignId: string, id: string, input: UpdatePaymentDto): Promise<PaymentDto> {
    const current = await this.findOne(campaignId, id);
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
    const effectiveMoulderId =
      moulderId ?? (contractorName !== undefined ? null : current.moulderId);
    if (effectiveMoulderId !== null) {
      await this.assertNoDuplicateType(
        campaignId,
        effectiveMoulderId,
        input.type ?? current.type,
        input.date ?? current.date,
        id,
      );
    }
    const row = await this.prisma.payment.update({ where: { id }, data, select: paymentSelect });
    return toDto(row);
  }

  /**
   * A moulder cannot be paid vatsy or an advance twice for the same day (reference document,
   * section 5): a repeated entry is almost always a mistake, unlike settlement, which can land
   * alongside a vatsy on the campaign's last day. A fee is rarer still and does not repeat: at
   * most one per moulder per campaign, whichever day it falls on, decided or not (18 September
   * 2026, section 10.9).
   */
  private async assertNoDuplicateType(
    campaignId: string,
    moulderId: string,
    type: PaymentType,
    date: string,
    excludeId?: string,
  ): Promise<void> {
    if (type === 'settlement') return;
    const existing = await this.prisma.payment.count({
      where: {
        campaignId,
        moulderId,
        type,
        date: type === 'fee' ? undefined : parseDateOnly(date),
        cancelledAt: null,
        id: excludeId === undefined ? undefined : { not: excludeId },
      },
    });
    if (existing > 0) {
      throw apiError(
        'payment_duplicate_type',
        type === 'fee'
          ? `A fee payment already exists for moulder ${moulderId} in campaign ${campaignId}`
          : `A ${type} payment already exists for moulder ${moulderId} on ${date}`,
        { type },
      );
    }
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.payment.update({ where: { id }, data: { cancelledAt: new Date() } });
  }
}

function toDto(row: PaymentRow): PaymentDto {
  return { ...row, date: formatDateOnly(row.date) };
}
