import { rejectsWithCode } from '../../test/api-error.expect.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StockService } from '../stock/stock.service.js';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  const campaignFindUnique = vi.fn();
  const saleFindMany = vi.fn();
  const expenseGroupBy = vi.fn();
  const productionAggregate = vi.fn();
  const contractorWorkGroupBy = vi.fn();
  const paymentAggregate = vi.fn();
  const salePaymentAggregate = vi.fn();
  const deliveryAggregate = vi.fn();
  const stockOverview = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    sale: { findMany: saleFindMany },
    salePayment: { aggregate: salePaymentAggregate },
    expense: { groupBy: expenseGroupBy },
    production: { aggregate: productionAggregate },
    contractorWork: { groupBy: contractorWorkGroupBy },
    payment: { aggregate: paymentAggregate },
    delivery: { aggregate: deliveryAggregate },
  } as unknown as PrismaService;
  const stock = { overview: stockOverview } as unknown as StockService;
  const service = new DashboardService(prisma, stock);

  const campaignId = 'campaign-id';
  const stockDto = {
    campaignId,
    produced: 40000,
    loaded: 40000,
    unloaded: 40000,
    delivered: 5000,
    raw: 0,
    inKiln: 0,
    fired: 35000,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      mouldingRate: 20,
      transportRate: 5,
      kilnLoadingRate: 3,
    });
    saleFindMany.mockResolvedValue([]);
    expenseGroupBy.mockResolvedValue([]);
    productionAggregate.mockResolvedValue({ _sum: { quantity: null } });
    contractorWorkGroupBy.mockResolvedValue([]);
    paymentAggregate.mockResolvedValue({ _sum: { amount: null } });
    salePaymentAggregate.mockResolvedValue({ _sum: { amount: null } });
    deliveryAggregate.mockResolvedValue({ _sum: { cost: null } });
    stockOverview.mockResolvedValue(stockDto);
  });

  it('is all zeros for a campaign without entries, with the stock alongside', async () => {
    await expect(service.overview(campaignId)).resolves.toMatchObject({
      campaignId,
      stock: stockDto,
      revenue: 0,
      received: 0,
      expenses: { total: 0 },
      labour: { total: 0, paid: 0 },
      deliveryCosts: 0,
      result: 0,
    });
    expect(saleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campaignId, cancelledAt: null } }),
    );
    expect(deliveryAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sale: { campaignId }, cancelledAt: null } }),
    );
    expect(salePaymentAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sale: { campaignId }, cancelledAt: null } }),
    );
  });

  it('feeds the database sums to the rule', async () => {
    saleFindMany.mockResolvedValue([{ orderedQuantity: 40000, unitPrice: 250 }]);
    salePaymentAggregate.mockResolvedValue({ _sum: { amount: 10_000_000 } });
    expenseGroupBy.mockResolvedValue([
      { category: 'akofa', _sum: { amount: 320_000 } },
      { category: 'rice_field', _sum: { amount: 500_000 } },
    ]);
    productionAggregate.mockResolvedValue({ _sum: { quantity: 40000 } });
    contractorWorkGroupBy.mockResolvedValue([
      { type: 'transport', _sum: { quantity: 40000 } },
      { type: 'kiln_loading', _sum: { quantity: 40000 } },
    ]);
    paymentAggregate.mockResolvedValue({ _sum: { amount: 400_000 } });
    deliveryAggregate.mockResolvedValue({ _sum: { cost: 120_000 } });
    await expect(service.overview(campaignId)).resolves.toMatchObject({
      revenue: 10_000_000,
      received: 10_000_000,
      outstanding: 0,
      expenses: { total: 820_000, byCategory: { akofa: 320_000, rice_field: 500_000 } },
      labour: { total: 1_120_000, paid: 400_000, outstanding: 720_000 },
      deliveryCosts: 120_000,
      result: 7_940_000,
    });
  });

  it('throws 404 for an unknown campaign before summing anything', async () => {
    campaignFindUnique.mockResolvedValue(null);
    await rejectsWithCode(service.overview('missing'), 'campaign_not_found');
    expect(saleFindMany).not.toHaveBeenCalled();
  });
});
