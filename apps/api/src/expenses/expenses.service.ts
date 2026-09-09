import { Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateExpenseDto,
  ExpenseDto,
  ListExpensesQuery,
  UpdateExpenseDto,
} from './expense.dto.js';

const expenseSelect = {
  id: true,
  campaignId: true,
  kilnBatchId: true,
  riceFieldId: true,
  date: true,
  category: true,
  amount: true,
  label: true,
} satisfies Prisma.ExpenseSelect;

type ExpenseRow = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
  ) {}

  async create(campaignId: string, input: CreateExpenseDto): Promise<ExpenseDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.date);
    await this.assertLinks(campaignId, input);
    const row = await this.prisma.expense.create({
      data: { ...input, campaignId, date: parseDateOnly(input.date) },
      select: expenseSelect,
    });
    return toDto(row);
  }

  async findAll(campaignId: string, query: ListExpensesQuery): Promise<ExpenseDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.expense.findMany({
      where: { campaignId, cancelledAt: null, ...query },
      select: expenseSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled expense is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<ExpenseDto> {
    const row = await this.prisma.expense.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: expenseSelect,
    });
    if (!row) throw new NotFoundException(`Expense ${id} not found`);
    return toDto(row);
  }

  async update(campaignId: string, id: string, input: UpdateExpenseDto): Promise<ExpenseDto> {
    await this.findOne(campaignId, id);
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), input.date);
    }
    await this.assertLinks(campaignId, input);
    const row = await this.prisma.expense.update({
      where: { id },
      data: { ...input, date: input.date === undefined ? undefined : parseDateOnly(input.date) },
      select: expenseSelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.expense.update({ where: { id }, data: { cancelledAt: new Date() } });
  }

  /** Only the links given (and not null) are checked: a detached or untouched link needs nothing. */
  private async assertLinks(
    campaignId: string,
    links: { kilnBatchId?: string | null; riceFieldId?: string | null },
  ): Promise<void> {
    if (links.kilnBatchId != null) await this.refs.assertKilnBatch(campaignId, links.kilnBatchId);
    if (links.riceFieldId != null) await this.refs.assertRiceField(links.riceFieldId);
  }
}

function toDto(row: ExpenseRow): ExpenseDto {
  return { ...row, date: formatDateOnly(row.date) };
}
