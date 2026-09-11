import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { formatDateOnly, parseDateOnly } from '../common/date-only.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CampaignDto, CreateCampaignDto, UpdateCampaignDto } from './campaign.dto.js';

const campaignSelect = {
  id: true,
  year: true,
  startedOn: true,
  closedOn: true,
  mouldingRate: true,
  transportRate: true,
  kilnLoadingRate: true,
} satisfies Prisma.CampaignSelect;

type CampaignRow = Prisma.CampaignGetPayload<{ select: typeof campaignSelect }>;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCampaignDto): Promise<CampaignDto> {
    assertDatesOrdered(input.startedOn, input.closedOn);
    const row = await this.prisma.campaign
      .create({
        data: {
          ...input,
          startedOn: parseDateOnly(input.startedOn),
          closedOn: input.closedOn === null ? null : parseDateOnly(input.closedOn),
        },
        select: campaignSelect,
      })
      .catch(rethrowYearConflict(input.year));
    return toDto(row);
  }

  async findAll(): Promise<CampaignDto[]> {
    const rows = await this.prisma.campaign.findMany({
      select: campaignSelect,
      orderBy: { year: 'desc' },
    });
    return rows.map(toDto);
  }

  async findOne(id: string): Promise<CampaignDto> {
    const row = await this.prisma.campaign.findUnique({ where: { id }, select: campaignSelect });
    if (!row) throw apiError('campaign_not_found', `Campaign ${id} not found`);
    return toDto(row);
  }

  /** The date rule is checked on the merged result, so closing a campaign needs only `closedOn`. */
  async update(id: string, input: UpdateCampaignDto): Promise<CampaignDto> {
    const current = await this.findOne(id);
    const startedOn = input.startedOn ?? current.startedOn;
    const closedOn = input.closedOn === undefined ? current.closedOn : input.closedOn;
    assertDatesOrdered(startedOn, closedOn);
    const row = await this.prisma.campaign
      .update({
        where: { id },
        data: {
          ...input,
          startedOn: parseDateOnly(startedOn),
          closedOn: closedOn === null ? null : parseDateOnly(closedOn),
        },
        select: campaignSelect,
      })
      .catch(rethrowYearConflict(input.year ?? current.year));
    return toDto(row);
  }
}

/** `YYYY-MM-DD` strings compare correctly as text, no Date needed. */
function assertDatesOrdered(startedOn: string, closedOn: string | null): void {
  if (closedOn !== null && closedOn < startedOn) {
    throw apiError('campaign_dates_out_of_order', 'closedOn must not be before startedOn');
  }
}

function rethrowYearConflict(year: number): (error: unknown) => never {
  return (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw apiError('campaign_year_taken', `A campaign for ${year} already exists`, { year });
    }
    throw error;
  };
}

function toDto(row: CampaignRow): CampaignDto {
  return {
    ...row,
    startedOn: formatDateOnly(row.startedOn),
    closedOn: row.closedOn === null ? null : formatDateOnly(row.closedOn),
  };
}
