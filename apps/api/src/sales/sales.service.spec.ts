import { rejectsWithCode } from '../../test/api-error.expect.js';
import { EntryReferences } from '../entries/entry-references.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from './sales.service.js';

describe('SalesService', () => {
  const campaignFindUnique = vi.fn();
  const clientFindUnique = vi.fn();
  const create = vi.fn();
  const findFirst = vi.fn();
  const update = vi.fn();
  const deliveryCount = vi.fn();
  const deliveryAggregate = vi.fn();
  const deliveryGroupBy = vi.fn();
  const paymentCount = vi.fn();
  const paymentAggregate = vi.fn();
  const paymentGroupBy = vi.fn();
  const findMany = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    client: { findUnique: clientFindUnique },
    sale: { create, findFirst, findMany, update },
    delivery: { count: deliveryCount, aggregate: deliveryAggregate, groupBy: deliveryGroupBy },
    salePayment: {
      count: paymentCount,
      aggregate: paymentAggregate,
      groupBy: paymentGroupBy,
    },
  } as unknown as PrismaService;
  const service = new SalesService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const clientId = 'client-id';
  const input = { clientId, date: '2026-08-01', orderedQuantity: 5000, unitPrice: 250 };
  const row = {
    id: 'sale-id',
    campaignId,
    clientId,
    date: new Date('2026-08-01T00:00:00Z'),
    orderedQuantity: 5000,
    unitPrice: 250,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    campaignFindUnique.mockResolvedValue({
      startedOn: new Date('2026-05-01T00:00:00Z'),
      closedOn: null,
    });
    clientFindUnique.mockResolvedValue({ id: clientId });
    deliveryAggregate.mockResolvedValue({ _sum: { quantity: null } });
    deliveryGroupBy.mockResolvedValue([]);
    paymentAggregate.mockResolvedValue({ _sum: { amount: null } });
    paymentGroupBy.mockResolvedValue([]);
  });

  describe('create', () => {
    it('stores what is owed, nothing delivered and nothing received yet', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'sale-id',
        campaignId,
        ...input,
        deliveredQuantity: 0,
        receivedAmount: 0,
        total: 1_250_000,
        outstanding: 1_250_000,
        status: 'ordered',
      });
      expect(deliveryAggregate).not.toHaveBeenCalled();
      expect(paymentAggregate).not.toHaveBeenCalled();
    });

    it('rejects a date outside the campaign and an unknown client', async () => {
      await rejectsWithCode(
        service.create(campaignId, { ...input, date: '2026-04-30' }),
        'date_outside_campaign',
      );
      clientFindUnique.mockResolvedValueOnce(null);
      await rejectsWithCode(service.create(campaignId, input), 'unknown_client');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('sums the live trips and the live instalments of the sale', async () => {
      findFirst.mockResolvedValue(row);
      deliveryAggregate.mockResolvedValue({ _sum: { quantity: 5000 } });
      paymentAggregate.mockResolvedValue({ _sum: { amount: 500_000 } });
      await expect(service.findOne(campaignId, 'sale-id')).resolves.toMatchObject({
        deliveredQuantity: 5000,
        receivedAmount: 500_000,
        outstanding: 750_000,
        status: 'partially_paid',
      });
      expect(paymentAggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { saleId: 'sale-id', cancelledAt: null } }),
      );
    });

    it('is paid once the instalments cover the total', async () => {
      findFirst.mockResolvedValue(row);
      paymentAggregate.mockResolvedValue({ _sum: { amount: 1_250_000 } });
      await expect(service.findOne(campaignId, 'sale-id')).resolves.toMatchObject({
        outstanding: 0,
        status: 'paid',
      });
    });

    it('lists with one grouped query per sum, sales without either at zero', async () => {
      findMany.mockResolvedValue([row, { ...row, id: 'other-id' }]);
      deliveryGroupBy.mockResolvedValue([{ saleId: 'sale-id', _sum: { quantity: 2500 } }]);
      paymentGroupBy.mockResolvedValue([{ saleId: 'sale-id', _sum: { amount: 300_000 } }]);
      const list = await service.findAll(campaignId);
      expect(
        list.map((sale) => [sale.id, sale.deliveredQuantity, sale.receivedAmount, sale.status]),
      ).toEqual([
        ['sale-id', 2500, 300_000, 'partially_paid'],
        ['other-id', 0, 0, 'ordered'],
      ]);
      expect(deliveryAggregate).not.toHaveBeenCalled();
      expect(paymentAggregate).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('corrects the order without touching what came in', async () => {
      findFirst.mockResolvedValue(row);
      paymentAggregate.mockResolvedValue({ _sum: { amount: 300_000 } });
      update.mockResolvedValue({ ...row, unitPrice: 260 });
      await expect(
        service.update(campaignId, 'sale-id', { unitPrice: 260 }),
      ).resolves.toMatchObject({ receivedAmount: 300_000, total: 1_300_000 });
      expect(clientFindUnique).not.toHaveBeenCalled();
    });

    it('throws 404 on a cancelled or unknown sale', async () => {
      findFirst.mockResolvedValue(null);
      await rejectsWithCode(
        service.update(campaignId, 'sale-id', { unitPrice: 260 }),
        'sale_not_found',
      );
    });
  });

  describe('cancel', () => {
    it('stamps cancelledAt instead of deleting', async () => {
      findFirst.mockResolvedValue(row);
      deliveryCount.mockResolvedValue(0);
      paymentCount.mockResolvedValue(0);
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'sale-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'sale-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });

    it('refuses with 409 while live trips or live instalments point at the sale', async () => {
      findFirst.mockResolvedValue(row);
      deliveryCount.mockResolvedValue(2);
      paymentCount.mockResolvedValue(0);
      await rejectsWithCode(service.cancel(campaignId, 'sale-id'), 'sale_has_deliveries');
      deliveryCount.mockResolvedValue(0);
      paymentCount.mockResolvedValue(1);
      await rejectsWithCode(service.cancel(campaignId, 'sale-id'), 'sale_has_payments');
      expect(update).not.toHaveBeenCalled();
    });
  });
});
