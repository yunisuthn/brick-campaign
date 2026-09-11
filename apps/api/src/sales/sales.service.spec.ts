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
  const findMany = vi.fn();
  const prisma = {
    campaign: { findUnique: campaignFindUnique },
    client: { findUnique: clientFindUnique },
    sale: { create, findFirst, findMany, update },
    delivery: { count: deliveryCount, aggregate: deliveryAggregate, groupBy: deliveryGroupBy },
  } as unknown as PrismaService;
  const service = new SalesService(prisma, new EntryReferences(prisma));

  const campaignId = 'campaign-id';
  const clientId = 'client-id';
  const input = {
    clientId,
    date: '2026-08-01',
    orderedQuantity: 5000,
    unitPrice: 250,
    payment: null,
  };
  const row = {
    id: 'sale-id',
    campaignId,
    clientId,
    date: new Date('2026-08-01T00:00:00Z'),
    orderedQuantity: 5000,
    unitPrice: 250,
    paidOn: null,
    amountReceived: null,
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
  });

  describe('create', () => {
    it('stores the sale unpaid, nothing delivered, with its total and status derived', async () => {
      create.mockResolvedValue(row);
      await expect(service.create(campaignId, input)).resolves.toEqual({
        id: 'sale-id',
        campaignId,
        ...input,
        deliveredQuantity: 0,
        total: 1_250_000,
        status: 'ordered',
      });
      expect(deliveryAggregate).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidOn: null, amountReceived: null }),
        }),
      );
    });

    it('rejects a date outside the campaign, an unknown client and a payment before the sale', async () => {
      await rejectsWithCode(
        service.create(campaignId, { ...input, date: '2026-04-30' }),
        'date_outside_campaign',
      );
      clientFindUnique.mockResolvedValueOnce(null);
      await rejectsWithCode(service.create(campaignId, input), 'unknown_client');
      await rejectsWithCode(
        service.create(campaignId, {
          ...input,
          payment: { paidOn: '2026-07-31', amountReceived: 1_250_000 },
        }),
        'sale_payment_before_sale',
      );
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('sums the live deliveries of the sale and derives the status from them', async () => {
      findFirst.mockResolvedValue(row);
      deliveryAggregate.mockResolvedValue({ _sum: { quantity: 5000 } });
      await expect(service.findOne(campaignId, 'sale-id')).resolves.toMatchObject({
        deliveredQuantity: 5000,
        status: 'delivered',
      });
      expect(deliveryAggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { saleId: 'sale-id', cancelledAt: null } }),
      );
    });

    it('lists with one grouped query, sales without a trip at zero', async () => {
      findMany.mockResolvedValue([row, { ...row, id: 'other-id' }]);
      deliveryGroupBy.mockResolvedValue([{ saleId: 'sale-id', _sum: { quantity: 2500 } }]);
      const list = await service.findAll(campaignId);
      expect(list.map((sale) => [sale.id, sale.deliveredQuantity, sale.status])).toEqual([
        ['sale-id', 2500, 'ordered'],
        ['other-id', 0, 'ordered'],
      ]);
      expect(deliveryAggregate).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('records the payment from payment alone, checked against the stored sale date', async () => {
      findFirst.mockResolvedValue(row);
      update.mockResolvedValue({
        ...row,
        paidOn: new Date('2026-08-20T00:00:00Z'),
        amountReceived: 1_250_000,
      });
      const payment = { paidOn: '2026-08-20', amountReceived: 1_250_000 };
      await expect(service.update(campaignId, 'sale-id', { payment })).resolves.toMatchObject({
        payment,
        status: 'paid',
      });
      expect(clientFindUnique).not.toHaveBeenCalled();
      await rejectsWithCode(
        service.update(campaignId, 'sale-id', {
          payment: { paidOn: '2026-07-31', amountReceived: 1_250_000 },
        }),
        'sale_payment_before_sale',
      );
    });

    it('takes a payment back with payment: null', async () => {
      findFirst.mockResolvedValue({
        ...row,
        paidOn: new Date('2026-08-20T00:00:00Z'),
        amountReceived: 1_250_000,
      });
      update.mockResolvedValue(row);
      await expect(service.update(campaignId, 'sale-id', { payment: null })).resolves.toMatchObject(
        { payment: null },
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidOn: null, amountReceived: null }),
        }),
      );
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
      update.mockResolvedValue(row);
      await service.cancel(campaignId, 'sale-id');
      expect(update).toHaveBeenCalledWith({
        where: { id: 'sale-id' },
        data: { cancelledAt: expect.any(Date) },
      });
    });

    it('refuses with 409 while live deliveries point at the sale', async () => {
      findFirst.mockResolvedValue(row);
      deliveryCount.mockResolvedValue(2);
      await rejectsWithCode(service.cancel(campaignId, 'sale-id'), 'sale_has_deliveries');
      expect(update).not.toHaveBeenCalled();
    });
  });
});
