import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { type MoulderBalance, moulderBalance } from './moulder-balance.js';

export interface MoulderBalanceDto extends MoulderBalance {
  moulderId: string;
  name: string;
}

/**
 * Everything here is derived at read time from the entries (reference document, section 5):
 * no balance is stored, so a corrected or cancelled entry is reflected immediately.
 * A campaign holds a few thousand entries at most, so they are summed in memory.
 */
@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  /** One line per moulder with at least one entry in the campaign, by name. */
  async moulders(campaignId: string): Promise<MoulderBalanceDto[]> {
    const rate = await this.mouldingRate(campaignId);
    const [productions, payments] = await Promise.all([
      this.productions(campaignId),
      this.payments(campaignId),
    ]);
    const ids = new Set([...productions, ...payments].map((e) => e.moulderId));
    const moulders = await this.prisma.moulder.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return moulders.map((m) => ({
      moulderId: m.id,
      name: m.name,
      ...moulderBalance(
        rate,
        productions.filter((p) => p.moulderId === m.id),
        payments.filter((p) => p.moulderId === m.id),
      ),
    }));
  }

  /** A known moulder with no entry in the campaign has a balance of zero, not a 404. */
  async moulder(campaignId: string, moulderId: string): Promise<MoulderBalanceDto> {
    const rate = await this.mouldingRate(campaignId);
    const moulder = await this.prisma.moulder.findUnique({
      where: { id: moulderId },
      select: { id: true, name: true },
    });
    if (!moulder) throw new NotFoundException(`Moulder ${moulderId} not found`);
    const [productions, payments] = await Promise.all([
      this.productions(campaignId, moulderId),
      this.payments(campaignId, moulderId),
    ]);
    return { moulderId, name: moulder.name, ...moulderBalance(rate, productions, payments) };
  }

  private async mouldingRate(campaignId: string): Promise<number> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { mouldingRate: true },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);
    return campaign.mouldingRate;
  }

  private productions(campaignId: string, moulderId?: string) {
    return this.prisma.production.findMany({
      where: { campaignId, moulderId, cancelledAt: null },
      select: { moulderId: true, quantity: true },
    });
  }

  /** Contractor payments carry no moulder and are not part of any moulder balance. */
  private async payments(campaignId: string, moulderId?: string) {
    const rows = await this.prisma.payment.findMany({
      where: { campaignId, moulderId: moulderId ?? { not: null }, cancelledAt: null },
      select: { moulderId: true, type: true, amount: true },
    });
    return rows.flatMap((r) => (r.moulderId === null ? [] : [{ ...r, moulderId: r.moulderId }]));
  }
}
