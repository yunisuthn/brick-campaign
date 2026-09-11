import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type ContractorBalance, contractorBalance } from './contractor-balance.js';
import { type MoulderBalance, moulderBalance } from './moulder-balance.js';

export interface MoulderBalanceDto extends MoulderBalance {
  moulderId: string;
  name: string;
}

export interface ContractorBalanceDto extends ContractorBalance {
  contractorName: string;
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
    const { mouldingRate } = await this.rates(campaignId);
    const [productions, payments] = await Promise.all([
      this.productions(campaignId),
      this.moulderPayments(campaignId),
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
        mouldingRate,
        productions.filter((p) => p.moulderId === m.id),
        payments.filter((p) => p.moulderId === m.id),
      ),
    }));
  }

  /** A known moulder with no entry in the campaign has a balance of zero, not a 404. */
  async moulder(campaignId: string, moulderId: string): Promise<MoulderBalanceDto> {
    const { mouldingRate } = await this.rates(campaignId);
    const moulder = await this.prisma.moulder.findUnique({
      where: { id: moulderId },
      select: { id: true, name: true },
    });
    if (!moulder) throw apiError('moulder_not_found', `Moulder ${moulderId} not found`);
    const [productions, payments] = await Promise.all([
      this.productions(campaignId, moulderId),
      this.moulderPayments(campaignId, moulderId),
    ]);
    return {
      moulderId,
      name: moulder.name,
      ...moulderBalance(mouldingRate, productions, payments),
    };
  }

  /** One line per contractor name seen in a work or a payment of the campaign, by name. */
  async contractors(campaignId: string): Promise<ContractorBalanceDto[]> {
    const rates = await this.rates(campaignId);
    const [works, payments] = await Promise.all([
      this.contractorWorks(campaignId),
      this.contractorPayments(campaignId),
    ]);
    const names = [...new Set([...works, ...payments].map((e) => e.contractorName))];
    return names
      .sort((a, b) => a.localeCompare(b))
      .map((contractorName) => ({
        contractorName,
        ...contractorBalance(
          rates,
          works.filter((w) => w.contractorName === contractorName),
          payments.filter((p) => p.contractorName === contractorName),
        ),
      }));
  }

  /** Contractors have no record of their own: a name with no entry in the campaign is a 404. */
  async contractor(campaignId: string, contractorName: string): Promise<ContractorBalanceDto> {
    const rates = await this.rates(campaignId);
    const [works, payments] = await Promise.all([
      this.contractorWorks(campaignId, contractorName),
      this.contractorPayments(campaignId, contractorName),
    ]);
    if (works.length === 0 && payments.length === 0) {
      throw apiError(
        'contractor_not_found',
        `No entry for contractor ${contractorName} in this campaign`,
      );
    }
    return { contractorName, ...contractorBalance(rates, works, payments) };
  }

  private async rates(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { mouldingRate: true, transportRate: true, kilnLoadingRate: true },
    });
    if (!campaign) throw apiError('campaign_not_found', `Campaign ${campaignId} not found`);
    return campaign;
  }

  private productions(campaignId: string, moulderId?: string) {
    return this.prisma.production.findMany({
      where: { campaignId, moulderId, cancelledAt: null },
      select: { moulderId: true, quantity: true },
    });
  }

  private contractorWorks(campaignId: string, contractorName?: string) {
    return this.prisma.contractorWork.findMany({
      where: { campaignId, contractorName, cancelledAt: null },
      select: { contractorName: true, type: true, quantity: true },
    });
  }

  /** Payments to a moulder; the contractor ones carry no moulder and are left out. */
  private async moulderPayments(campaignId: string, moulderId?: string) {
    const rows = await this.prisma.payment.findMany({
      where: { campaignId, moulderId: moulderId ?? { not: null }, cancelledAt: null },
      select: { moulderId: true, type: true, amount: true },
    });
    return rows.flatMap((r) => (r.moulderId === null ? [] : [{ ...r, moulderId: r.moulderId }]));
  }

  private async contractorPayments(campaignId: string, contractorName?: string) {
    const rows = await this.prisma.payment.findMany({
      where: { campaignId, contractorName: contractorName ?? { not: null }, cancelledAt: null },
      select: { contractorName: true, type: true, amount: true },
    });
    return rows.flatMap((r) =>
      r.contractorName === null ? [] : [{ ...r, contractorName: r.contractorName }],
    );
  }
}
