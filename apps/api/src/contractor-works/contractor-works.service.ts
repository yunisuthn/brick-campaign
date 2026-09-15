import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { EntryReferences } from '../entries/entry-references.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ContractorWorkDto,
  CreateContractorWorkDto,
  ListContractorWorksQuery,
  UpdateContractorWorkDto,
} from './contractor-work.dto.js';

const contractorWorkSelect = {
  id: true,
  campaignId: true,
  kilnBatchId: true,
  type: true,
  contractorName: true,
  date: true,
  quantity: true,
  rate: true,
} satisfies Prisma.ContractorWorkSelect;

type ContractorWorkRow = Prisma.ContractorWorkGetPayload<{ select: typeof contractorWorkSelect }>;

@Injectable()
export class ContractorWorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: EntryReferences,
  ) {}

  async create(campaignId: string, input: CreateContractorWorkDto): Promise<ContractorWorkDto> {
    const campaign = await this.refs.campaignWindow(campaignId);
    this.refs.assertWithinCampaign(campaign, input.date);
    await this.refs.assertKilnBatch(campaignId, input.kilnBatchId);
    if (input.type === 'transport') await this.refs.assertTransportRate(campaignId, input.rate);
    const row = await this.prisma.contractorWork.create({
      data: { ...input, campaignId, date: parseDateOnly(input.date) },
      select: contractorWorkSelect,
    });
    return toDto(row);
  }

  async findAll(campaignId: string, query: ListContractorWorksQuery): Promise<ContractorWorkDto[]> {
    await this.refs.campaignWindow(campaignId);
    const rows = await this.prisma.contractorWork.findMany({
      where: { campaignId, cancelledAt: null, ...query },
      select: contractorWorkSelect,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toDto);
  }

  /** A cancelled entry is gone from the API: reading, correcting or cancelling it again is a 404. */
  async findOne(campaignId: string, id: string): Promise<ContractorWorkDto> {
    const row = await this.prisma.contractorWork.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: contractorWorkSelect,
    });
    if (!row) throw apiError('contractor_work_not_found', `Contractor work ${id} not found`);
    return toDto(row);
  }

  async update(
    campaignId: string,
    id: string,
    input: UpdateContractorWorkDto,
  ): Promise<ContractorWorkDto> {
    const current = await this.findOne(campaignId, id);
    if (input.date !== undefined) {
      this.refs.assertWithinCampaign(await this.refs.campaignWindow(campaignId), input.date);
    }
    if (input.kilnBatchId !== undefined) {
      await this.refs.assertKilnBatch(campaignId, input.kilnBatchId);
    }
    if (input.rate !== undefined && (input.type ?? current.type) === 'transport') {
      await this.refs.assertTransportRate(campaignId, input.rate);
    }
    const row = await this.prisma.contractorWork.update({
      where: { id },
      data: { ...input, date: input.date === undefined ? undefined : parseDateOnly(input.date) },
      select: contractorWorkSelect,
    });
    return toDto(row);
  }

  async cancel(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.contractorWork.update({ where: { id }, data: { cancelledAt: new Date() } });
  }
}

function toDto(row: ContractorWorkRow): ContractorWorkDto {
  return { ...row, date: formatDateOnly(row.date) };
}
