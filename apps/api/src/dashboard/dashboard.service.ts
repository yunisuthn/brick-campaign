import { Injectable } from '@nestjs/common';
import { apiError } from '../common/api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { type StockDto, StockService } from '../stock/stock.service.js';
import { type CampaignResult, campaignResult } from './campaign-result.js';

export interface DashboardDto extends CampaignResult {
  campaignId: string;
  stock: StockDto;
}

/**
 * One read for the whole campaign. Everything is derived from the live entries (reference
 * document, section 5): the database sums them, the rule combines the sums. A campaign without
 * any entry is all zeros; only an unknown campaign is a 404.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
  ) {}

  async overview(campaignId: string): Promise<DashboardDto> {
    const rates = await this.rates(campaignId);
    const live = { campaignId, cancelledAt: null };
    const [
      sales,
      salePayments,
      expenses,
      productions,
      contractorWorks,
      payments,
      deliveries,
      stock,
    ] = await Promise.all([
      this.prisma.sale.findMany({
        where: live,
        select: { orderedQuantity: true, unitPrice: true },
      }),
      this.prisma.salePayment.aggregate({
        where: { sale: { campaignId }, cancelledAt: null },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({ by: ['category'], where: live, _sum: { amount: true } }),
      this.prisma.production.findMany({ where: live, select: { quantity: true, rate: true } }),
      this.prisma.contractorWork.findMany({
        where: live,
        select: { type: true, quantity: true, rate: true },
      }),
      this.prisma.payment.aggregate({ where: live, _sum: { amount: true } }),
      this.prisma.delivery.aggregate({
        where: { sale: { campaignId }, cancelledAt: null },
        _sum: { cost: true },
      }),
      this.stock.overview(campaignId),
    ]);
    return {
      campaignId,
      stock,
      ...campaignResult(rates, {
        // Kept per sale: the total is a sum of products, not a product of sums.
        sales,
        salePayments: [{ amount: salePayments._sum.amount ?? 0 }],
        expenses: expenses.map((g) => ({ category: g.category, amount: g._sum.amount ?? 0 })),
        productions,
        contractorWorks,
        payments: [{ amount: payments._sum.amount ?? 0 }],
        deliveries: [{ cost: deliveries._sum.cost ?? 0 }],
      }),
    };
  }

  private async rates(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { kilnLoadingRate: true },
    });
    if (!campaign) throw apiError('campaign_not_found', `Campaign ${campaignId} not found`);
    return campaign;
  }
}
