import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
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
    if (!campaign) throw apiError('campaign_not_found', `Campaign ${campaignId} not found`);
    return {
      startedOn: formatDateOnly(campaign.startedOn),
      closedOn: campaign.closedOn === null ? null : formatDateOnly(campaign.closedOn),
    };
  }

  assertWithinCampaign(campaign: CampaignWindow, date: string): void {
    if (!isWithinCampaign(campaign, date)) {
      throw apiError('date_outside_campaign', 'date must fall within the campaign', {
        startedOn: campaign.startedOn,
        closedOn: campaign.closedOn,
      });
    }
  }

  /** A retired moulder gets no new entry; correcting an old entry of theirs is still allowed. */
  async assertActiveMoulder(id: string): Promise<void> {
    const moulder = await this.prisma.moulder.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!moulder) throw apiError('unknown_moulder', `Unknown moulder ${id}`);
    if (!moulder.active) throw apiError('moulder_inactive', `Moulder ${id} is inactive`);
  }

  async assertRiceField(id: string): Promise<void> {
    const field = await this.prisma.riceField.findUnique({ where: { id }, select: { id: true } });
    if (!field) throw apiError('unknown_rice_field', `Unknown rice field ${id}`);
  }

  /** `null` is always allowed ("to be fixed later"); a chosen rate must be one the campaign offers. */
  async assertMouldingRate(campaignId: string, rate: number | null): Promise<void> {
    if (rate === null) return;
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { mouldingRates: true },
    });
    if (!campaign?.mouldingRates.includes(rate)) {
      throw apiError(
        'unknown_moulding_rate',
        `${rate} is not one of this campaign's moulding rates`,
      );
    }
  }

  /** Same rule as `assertMouldingRate`, checked against the campaign's transport rates. */
  async assertTransportRate(campaignId: string, rate: number | null): Promise<void> {
    if (rate === null) return;
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { transportRates: true },
    });
    if (!campaign?.transportRates.includes(rate)) {
      throw apiError(
        'unknown_transport_rate',
        `${rate} is not one of this campaign's transport rates`,
      );
    }
  }

  async assertClient(id: string): Promise<void> {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!client) throw apiError('unknown_client', `Unknown client ${id}`);
  }

  /** The batch must be live and belong to the same campaign as the entry. */
  async assertKilnBatch(campaignId: string, id: string): Promise<void> {
    const batch = await this.prisma.kilnBatch.findFirst({
      where: { id, campaignId, cancelledAt: null },
      select: { id: true },
    });
    if (!batch) throw apiError('unknown_kiln_batch', `Unknown kiln batch ${id} in this campaign`);
  }
}
