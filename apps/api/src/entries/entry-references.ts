import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { formatDateOnly } from '../common/date-only.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type CampaignWindow, isWithinCampaign } from './campaign-window.js';

/**
 * Checks shared by every entry recorded under a campaign (productions, payments, ...).
 * The campaign is part of the route, so a missing one is a 404; the moulder, rice field, client
 * and kiln batch are part of the body, so a bad one is a 400.
 */
@Injectable()
export class EntryReferences {
  constructor(private readonly prisma: PrismaService) {}

  async campaignWindow(campaignId: string): Promise<CampaignWindow> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { startedOn: true, closedOn: true },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);
    return {
      startedOn: formatDateOnly(campaign.startedOn),
      closedOn: campaign.closedOn === null ? null : formatDateOnly(campaign.closedOn),
    };
  }

  assertWithinCampaign(campaign: CampaignWindow, date: string): void {
    if (!isWithinCampaign(campaign, date)) {
      throw new BadRequestException('date must fall within the campaign');
    }
  }

  /** A retired moulder gets no new entry; correcting an old entry of theirs is still allowed. */
  async assertActiveMoulder(id: string): Promise<void> {
    const moulder = await this.prisma.moulder.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!moulder) throw new BadRequestException(`Unknown moulder ${id}`);
    if (!moulder.active) throw new BadRequestException(`Moulder ${id} is inactive`);
  }

  async assertRiceField(id: string): Promise<void> {
    const field = await this.prisma.riceField.findUnique({ where: { id }, select: { id: true } });
    if (!field) throw new BadRequestException(`Unknown rice field ${id}`);
  }

  async assertClient(id: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!client) throw new BadRequestException(`Unknown client ${id}`);
  }

  /** The batch must be live and belong to the same campaign as the entry. */
  async assertKilnBatch(campaignId: string, id: string): Promise<void> {
    const batch = await this.prisma.kilnBatch.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: { id: true },
    });
    if (!batch) throw new BadRequestException(`Unknown kiln batch ${id} in this campaign`);
  }
}
